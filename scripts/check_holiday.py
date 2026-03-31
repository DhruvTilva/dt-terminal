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
    # Filter to only today's IST candles
    today_candles = [
        ts for ts in timestamps
        if (datetime.fromtimestamp(ts, tz=timezone.utc) + IST).strftime('%Y-%m-%d') == scan_date
    ]
    # NSE has ~75 candles on a normal trading day (9:15–3:30 PM, 5m interval)
    # Holiday or no data = fewer than 10 candles for today
    print('false' if len(today_candles) >= 10 else 'true')
except Exception:
    print('false')
