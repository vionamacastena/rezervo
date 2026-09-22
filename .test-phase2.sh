#!/bin/bash
API="http://localhost:8000/api/v1"

# 1) Login
echo "════════ LOGIN ════════"
RESPONSE=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@rezervo.com","password":"Admin12345!","device_name":"cli"}')

TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Token: $TOKEN"
echo ""

AUTH=(-H "Accept: application/json" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

# 2) Krijo klient
echo "════════ KRIJO KLIENT ════════"
CLIENT=$(curl -s -X POST "$API/clients" "${AUTH[@]}" \
  -d '{"first_name":"Arta","last_name":"Krasniqi","email":"arta@example.com","phone":"+383 44 123 456"}')
echo "$CLIENT" | python3 -m json.tool
CLIENT_ID=$(echo "$CLIENT" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo ""

# 3) Listo klientët
echo "════════ LISTO KLIENTËT ════════"
curl -s "$API/clients" "${AUTH[@]}" | python3 -m json.tool
echo ""

# 4) Krijo rezervim
echo "════════ KRIJO REZERVIM ════════"
START=$(date -u -v+1d '+%Y-%m-%dT18:00:00Z' 2>/dev/null || date -u -d '+1 day' '+%Y-%m-%dT18:00:00Z')
END=$(date -u -v+1d '+%Y-%m-%dT21:00:00Z' 2>/dev/null || date -u -d '+1 day' '+%Y-%m-%dT21:00:00Z')

RESERVATION=$(curl -s -X POST "$API/reservations" "${AUTH[@]}" \
  -d "{\"client_id\":$CLIENT_ID,\"starts_at\":\"$START\",\"ends_at\":\"$END\",\"guests_count\":4,\"resource\":\"Salla A\",\"total_price\":120,\"currency\":\"EUR\"}")
echo "$RESERVATION" | python3 -m json.tool
RES_ID=$(echo "$RESERVATION" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo ""

# 5) Konfirmo rezervimin
echo "════════ KONFIRMO REZERVIMIN ════════"
curl -s -X POST "$API/reservations/$RES_ID/confirm" "${AUTH[@]}" | python3 -m json.tool
echo ""

# 6) Provo double-booking
echo "════════ PROVO DOUBLE-BOOKING (duhet 409) ════════"
curl -s -X POST "$API/reservations" "${AUTH[@]}" \
  -d "{\"client_id\":$CLIENT_ID,\"starts_at\":\"$START\",\"ends_at\":\"$END\",\"guests_count\":2,\"resource\":\"Salla A\"}" | python3 -m json.tool
echo ""

# 7) Anulo rezervimin
echo "════════ ANULO REZERVIMIN ════════"
curl -s -X POST "$API/reservations/$RES_ID/cancel" "${AUTH[@]}" \
  -d '{"reason":"Klienti anuloi me telefon"}' | python3 -m json.tool
echo ""
