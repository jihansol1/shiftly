import anthropic
import json
from datetime import date, timedelta
from app.config import settings


def generate_schedule(
    availabilities: list[dict],
    shift_requirements: list[dict],
    week_start_date: date
) -> list[dict]:
    """
    Use Claude API to generate optimal shift assignments.
    """
    
    # Build dates for the week
    week_dates = {}
    for i in range(7):
        d = week_start_date + timedelta(days=i)
        week_dates[i] = d.isoformat()
    
    # Group availability by user for clearer prompt
    user_availability = {}
    for avail in availabilities:
        user_id = avail['user_id']
        name = f"{avail['first_name']} {avail['last_name']}"
        if user_id not in user_availability:
            user_availability[user_id] = {
                'name': name,
                'user_id': user_id,
                'available_days': []
            }
        
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        day_name = day_names[avail['day_of_week']]
        user_availability[user_id]['available_days'].append({
            'day': day_name,
            'day_of_week': avail['day_of_week'],
            'date': week_dates[avail['day_of_week']],
            'start_time': avail['start_time'],
            'end_time': avail['end_time']
        })
    
    # Format availability for prompt
    availability_text = ""
    for user_id, data in user_availability.items():
        availability_text += f"\n{data['name']} (user_id: {user_id}):\n"
        for day in data['available_days']:
            availability_text += f"  - {day['day']} ({day['date']}): {day['start_time']} to {day['end_time']}\n"
    
    # Format shift requirements
    day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    requirements_text = ""
    for req in shift_requirements:
        day_name = day_names[req['day_of_week']]
        req_date = week_dates[req['day_of_week']]
        requirements_text += f"  - {day_name} ({req_date}): {req['start_time']} to {req['end_time']}, need {req['min_workers']} worker(s)\n"

    prompt = f"""You are a shift scheduling assistant. Your job is to assign employees to shifts based on their availability.

EMPLOYEE AVAILABILITY:
{availability_text}

SHIFTS THAT NEED COVERAGE:
{requirements_text}

CRITICAL RULES:
1. You can ONLY assign an employee to a shift if they are available on that EXACT day
2. If an employee is available Monday, they can ONLY work Monday shifts - NOT Tuesday, Wednesday, etc.
3. The shift time must fall within the employee's available hours
4. Meet the minimum workers requirement for each shift
5. If no one is available for a shift, do not include it in the output

EXAMPLE:
- If John is available Monday 09:00-17:00, you can assign him to Monday shifts only
- If Jane is available Tuesday 09:00-17:00, you can assign her to Tuesday shifts only
- Do NOT assign John to Tuesday or Jane to Monday

Return ONLY a valid JSON array with shift assignments. Each object must have:
- user_id (integer)
- shift_date (string in YYYY-MM-DD format)
- start_time (string in HH:MM format)
- end_time (string in HH:MM format)

Example response format:
[
    {{"user_id": 1, "shift_date": "2025-01-06", "start_time": "09:00", "end_time": "17:00"}},
    {{"user_id": 2, "shift_date": "2025-01-07", "start_time": "09:00", "end_time": "17:00"}}
]

Return ONLY the JSON array, no explanation or other text."""

    # Call Claude API
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    
    message = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=1024,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    # Parse response
    response_text = message.content[0].text.strip()
    
    # Clean response if needed (remove markdown code blocks)
    if "```" in response_text:
        # Extract content between code blocks
        parts = response_text.split("```")
        for part in parts:
            if part.strip().startswith("json"):
                response_text = part.strip()[4:].strip()
                break
            elif part.strip().startswith("["):
                response_text = part.strip()
                break
    
    shifts = json.loads(response_text)
    
    return shifts