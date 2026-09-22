#!/bin/bash
# Skript ndihmës për testime API

API="http://localhost:8000/api/v1"

# Login dhe ekstrakto token
RESPONSE=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@rezervo.com","password":"Admin12345!","device_name":"cli"}')

TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "🔑 Token: $TOKEN"
echo ""

echo "=== /auth/me ==="
curl -s "$API/auth/me" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== /health ==="
curl -s "$API/health" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
