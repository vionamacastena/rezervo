#!/bin/bash
API="http://localhost:8000/api/v1/public/demo"
SEP="════════════════════════════════════════════"

echo "$SEP"
echo "  1) INFO TENANT + SERVICES"
echo "$SEP"
curl -s "$API" | python3 -m json.tool
echo ""

DATE=$(date -v+1d '+%Y-%m-%d' 2>/dev/null || date -d '+1 day' '+%Y-%m-%d')
echo "$SEP"
echo "  2) AVAILABILITY për $DATE (service_id=2)"
echo "$SEP"
curl -s "$API/availability?date=$DATE&service_id=2" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f\"Service: {d['service_id']} ({d['service_duration']} min)\")
print(f\"Total slots: {len(d['slots'])}\")
print('Shembull 5 slots të parë:')
for s in d['slots'][:5]:
    status = '✅ lirë' if s['available'] else '❌ ' + (s['reason'] or '')
    print(f\"  {s['time']}  {status}\")
"
echo ""

echo "$SEP"
echo "  3) BOOK një termin në 10:00"
echo "$SEP"
curl -s -X POST "$API/book" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"service_id\": 2,
    \"starts_at\": \"${DATE}T10:00:00Z\",
    \"first_name\": \"Arben\",
    \"last_name\": \"Gashi\",
    \"phone\": \"+383 44 555 666\",
    \"email\": \"arben@example.com\",
    \"notes\": \"Klient i ri\"
  }" | python3 -m json.tool
echo ""

echo "$SEP"
echo "  4) VERIFIKO - availability pas booking (10:00 duhet zënë)"
echo "$SEP"
curl -s "$API/availability?date=$DATE&service_id=2" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for s in d['slots']:
    if s['time'] in ['09:00', '09:30', '10:00', '10:30', '11:00']:
        status = '✅ lirë' if s['available'] else '❌ ' + (s['reason'] or '')
        print(f\"  {s['time']}  {status}\")
"
echo ""
echo "$SEP"
echo "  ✅ TESTI PËRFUNDOI"
echo "$SEP"
