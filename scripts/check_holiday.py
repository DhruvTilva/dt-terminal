"""
Check if today is a market holiday by verifying NSE trading data exists.
Usage: python3 scripts/check_holiday.py <YYYY-MM-DD>
Prints: 'true' if holiday (no data), 'false' if market was open
"""
import json
import sys
from datetime import datetime
from datetime import timezone
from datetime import timedelta

IST = timedelta(hours=5, minutes=30)
scan_date = sys.argv[1]

try:
    with open('/tmp/reliance.json') as f:
        data = json.load(f)
    result = data.get('chart', {}).get('result') or []
    timestamps = result[0].get('timestamp', []) if result else []
    if not timestamps:
        print('true')
    else:
        has_today = any(
            (datetime.fromtimestamp(ts, tz=timezone.utc) + IST).strftime('%Y-%m-%d') == scan_date
            for ts in timestamps
        )
        print('false' if has_today else 'true')
except Exception:
    print('false')
