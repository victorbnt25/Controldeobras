<?php
// CORS se gestiona en Apache (mod_headers).
// Aquí solo fijamos que la API siempre devuelva JSON.
header("Content-Type: application/json");
