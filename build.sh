#!/bin/bash
echo "const CONFIG = {" > config.js
echo "  SUPABASE_URL: '$SUPABASE_URL'," >> config.js
echo "  SUPABASE_ANON_KEY: '$SUPABASE_ANON_KEY'" >> config.js
echo "};" >> config.js
