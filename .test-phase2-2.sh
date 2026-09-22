#!/bin/bash
API="http://localhost:8000/api/v1"
SEP="════════════════════════════════════════════"

RESPONSE=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"email":"admin@rezervo.com","password":"Admin12345!","device_name":"cli"}')
TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
AUTH=(-H "Accept: application/json" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

echo "$SEP"
echo "  LOGIN OK — ${TOKEN:0:30}..."
echo "$SEP"

# Klient — DEBUG i plotë
echo ""
echo "→ Duke krijuar klient..."
CLIENT_RESPONSE=$(curl -s -X POST "$API/clients" "${AUTH[@]}" \
  -d '{"first_name":"Test","last_name":"Payments","phone":"+383 44 000 000"}')
echo "$CLIENT_RESPONSE" | python3 -m json.tool

CLIENT_ID=$(echo "$CLIENT_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

if [ -z "$CLIENT_ID" ]; then
  echo "❌ CLIENT_ID është bosh. Ndalo."
  exit 1
fi

echo "✅ Client ID: $CLIENT_ID"

# Rezervim — DEBUG i plotë
echo ""
echo "→ Duke krijuar rezervim..."
START=$(date -u -v+2d '+%Y-%m-%dT18:00:00Z' 2>/dev/null || date -u -d '+2 day' '+%Y-%m-%dT18:00:00Z')
END=$(date -u -v+2d '+%Y-%m-%dT21:00:00Z' 2>/dev/null || date -u -d '+2 day' '+%Y-%m-%dT21:00:00Z')

RES_RESPONSE=$(curl -s -X POST "$API/reservations" "${AUTH[@]}" \
  -d "{\"client_id\":$CLIENT_ID,\"starts_at\":\"$START\",\"ends_at\":\"$END\",\"guests_count\":2,\"resource\":\"Salla B\",\"total_price\":200}")

RES_ID=$(echo "$RES_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

if [ -z "$RES_ID" ]; then
  echo "❌ RES_ID bosh. Response:"
  echo "$RES_RESPONSE" | python3 -m json.tool
  exit 1
fi

echo "✅ Reservation ID: $RES_ID"

# Pagesa
echo ""
echo "$SEP"
echo "  PAGESA"
echo "$SEP"

PAY_RESPONSE=$(curl -s -X POST "$API/payments" "${AUTH[@]}" \
  -d "{\"reservation_id\":$RES_ID,\"amount\":100,\"method\":\"cash\",\"payment_date\":\"$(date +%Y-%m-%d)\"}")
echo "$PAY_RESPONSE" | python3 -m json.tool

# Pagesa mbi totalin
echo ""
echo "→ Test: pagesë mbi totalin (duhet 422)"
curl -s -X POST "$API/payments" "${AUTH[@]}" \
  -d "{\"reservation_id\":$RES_ID,\"amount\":500,\"method\":\"card\",\"payment_date\":\"$(date +%Y-%m-%d)\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"  [{d.get('success')}] {d.get('message')}\")"

# Dashboard
echo ""
echo "$SEP"
echo "  DASHBOARD"
echo "$SEP"
curl -s "$API/reports/dashboard" "${AUTH[@]}" | python3 -m json.tool

echo ""
echo "$SEP"
echo "  ✅ TESTI PËRFUNDOI"
echo "$SEP"
