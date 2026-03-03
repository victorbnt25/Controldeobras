<?php
// backend/api/cambiar_clave.php
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = obtenerConexionBD();
    
    // Hash para la contraseña "1234"
    $nuevaContrasena = password_hash('1234', PASSWORD_DEFAULT);
    
    // Asumimos que el usuario administrador se llama 'admin'
    $stmt = $pdo->prepare("UPDATE usuarios SET password = ? WHERE rol = 'superusuario' OR username = 'admin' LIMIT 1");
    $stmt->execute([$nuevaContrasena]);
    
    if ($stmt->rowCount() > 0) {
        echo "<h2 style='color: green;'>¡Éxito!</h2>";
        echo "<p>La contraseña del administrador ha sido cambiada a: <b>1234</b></p>";
        echo "<p>Por seguridad, te recomendamos borrar este archivo (cambiar_clave.php) después de comprobar que puedes entrar.</p>";
        echo "<a href='/'>Ir al Login</a>";
    } else {
        echo "<h2 style='color: orange;'>Atención</h2>";
        echo "<p>No se actualizó ninguna fila. Esto puede deberse a que la contraseña ya es 1234 o que no existe ningún usuario llamado 'admin'.</p>";
    }
} catch (Exception $e) {
    echo "<h2 style='color: red;'>Error</h2>";
    echo "<p>No se pudo conectar a la base de datos o hubo un error en la ejecución:</p>";
    echo "<pre>" . $e->getMessage() . "</pre>";
}
