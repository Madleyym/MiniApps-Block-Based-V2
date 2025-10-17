twenty-one@twenty-one MINGW64 ~/Desktop/MiniApps (main)
$ node scripts/test-populate-db.js
============================================================
[POPULATE] Starting...
[POPULATE] Clearing old test data (FID >= 100000)...
[POPULATE] Inserting 10 test players...
[POPULATE] ✅ SUCCESS!
[POPULATE] Inserted:
============================================================
   1. TestPlayer1     | 10000 pts | 0xAeab...3481
   2. TestPlayer2     |  9500 pts | 0x07DC...Ce9f
   3. TestPlayer3     |  9000 pts | 0x2f7A...0334
   4. TestPlayer4     |  8500 pts | 0x1234...7890
   5. TestPlayer5     |  8000 pts | 0x2345...8901
   6. TestPlayer6     |  7500 pts | 0x3456...9012
   7. TestPlayer7     |  7000 pts | 0x4567...0123
   8. TestPlayer8     |  6500 pts | 0x5678...1234
   9. TestPlayer9     |  6000 pts | 0x6789...2345
  10. TestPlayer10    |  5500 pts | 0x7890...3456
============================================================

twenty-one@twenty-one MINGW64 ~/Desktop/MiniApps (main)
$ curl -X POST http://localhost:3000/api/finalize-week \
  -H "Content-Type: application/json" \
  -d '{"secret":"b2222382-49c2-4628-a9be-690575893396","autoExecute":false}'
{"success":true,"message":"Winners ready for manual finalization","data":{"week":1,"contractAddress":"0x50280E0aE6157dE214bd38298D25341F1FADB993","winners":["0xAeabadae3Cc5f1d1A5De4903a195BF2796dF3481","0x07DCE223775f17D6d09dbC3241b488cBb1e6Ce9f","0x2f7AD3F11c6d65909bfbdC0c9a4Cd8B512bc0334","0x1234567890123456789012345678901234567890","0x2345678901234567890123456789012345678901","0x3456789012345678901234567890123456789012","0x4567890123456789012345678901234567890123","0x5678901234567890123456789012345678901234","0x6789012345678901234567890123456789012345","0x7890123456789012345678901234567890123456"],"topPlayers":[{"rank":1,"username":"TestPlayer1","score":10000,"wallet":"0xAeabadae3Cc5f1d1A5De4903a195BF2796dF3481"},{"rank":2,"username":"TestPlayer2","score":9500,"wallet":"0x07DCE223775f17D6d09dbC3241b488cBb1e6Ce9f"},{"rank":3,"username":"TestPlayer3","score":9000,"wallet":"0x2f7AD3F11c6d65909bfbdC0c9a4Cd8B512bc0334"},{"rank":4,"username":"TestPlayer4","score":8500,"wallet":"0x1234567890123456789012345678901234567890"},{"rank":5,"username":"TestPlayer5","score":8000,"wallet":"0x2345678901234567890123456789012345678901"},{"rank":6,"username":"TestPlayer6","score":7500,"wallet":"0x3456789012345678901234567890123456789012"},{"rank":7,"username":"TestPlayer7","score":7000,"wallet":"0x4567890123456789012345678901234567890123"},{"rank":8,"username":"TestPlayer8","score":6500,"wallet":"0x5678901234567890123456789012345678901234"},{"rank":9,"username":"TestPlayer9","score":6000,"wallet":"0x6789012345678901234567890123456789012345"},{"rank":10,"username":"TestPlayer10","score":5500,"wallet":"0x7890123456789012345678901234567890123456"}]}}     
twenty-one@twenty-one MINGW64 ~/Desktop/MiniApps (main)
$ curl -X POST http://localhost:3000/api/finalize-week \
  -H "Content-Type: application/json" \
  -d '{"secret":"b2222382-49c2-4628-a9be-690575893396","autoExecute":true,"weekNumber":1}'
{"success":false,"error":"invalid private key, expected hex or 32 bytes, got string"}
twenty-one@twenty-one MINGW64 ~/Desktop/MiniApps (main)
$ curl -X POST http://localhost:3000/api/finalize-week   -H "Content-Type: application/json"   -d '{"secret":"b2222382-49c2-4628-a9be-690575893396","autoExecute":true,"weekNumber":1}'
{"success":false,"error":"No prize pool for week 1"}
twenty-one@twenty-one MINGW64 ~/Desktop/MiniApps (main)
$