"""
Calls the Claude API to automatically generate shift assignments based on 
    - Employee availability
    - Shifts that need coverage
"""

import anthropic
import json
from datetime import date, timedelta
from app.config import settings

# Use Claude API to generate optimal shift assignments
def generate_schedule(
    availabilities: list[dict],
    shift_requirements: list[dict],
    week_start_date: date
) -> list[dict]:

    # Build dates for the week
    week_dates = {
        i: (week_start_date + timedelta(days=i)).isoformat()
        for i in range(7)
    }
    
    # Create prompt for Claude
    prompt = f"""You are a shift scheduling assistant. Generate optimal shift assignments based on employee availability.
            EMPLOYEE AVAILABILITY:
            {json.dumps(availabilities, indent=2, default=str)}

            SHIFTS THAT NEED COVERAGE:
            {json.dumps(shift_requirements, indent=2, default=str)}

            WEEK DATES:
            - Monday (day 0): {week_dates[0]}
            - Tuesday (day 1): {week_dates[1]}
            - Wednesday (day 2): {week_dates[2]}
            - Thursday (day 3): {week_dates[3]}
            - Friday (day 4): {week_dates[4]}
            - Saturday (day 5): {week_dates[5]}
            - Sunday (day 6): {week_dates[6]}

            RULES:
            1. Only assign employees to shifts during their available times
            2. Meet the minimum workers requirement for each shift
            3. Distribute shifts fairly among employees
            4. An employee cannot work overlapping shifts

            Return ONLY a JSON array of shift assignments with this exact format:
            [
                {{"user_id": 1, "shift_date": "2024-12-30", "start_time": "09:00", "end_time": "17:00"}},
                ...
            ]

            Return ONLY the JSON array, no other text.
            """

    # Call Claude API
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    message = client.messages.create(
        model="claude-sonnet-4 20250514",
        max_tokens=1024,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    # parse response
    response_text = message.content[0].text
    
    # Clean response if needed (remove markdown code blocks)
    if response_text.startswith("```"):
        response_text = response_text.split("```")[1]
        if response_text.startswith("json"):
            response_text = response_text[4:]
    
    shifts = json.loads(response_text)
    
    return shifts