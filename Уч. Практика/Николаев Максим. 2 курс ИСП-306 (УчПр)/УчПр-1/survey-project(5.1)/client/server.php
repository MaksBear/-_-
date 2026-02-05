<?php
// Простой PHP бэкенд для демонстрации
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$action = $_GET['action'] ?? '';

if ($action === 'login') {
    // В реальном приложении здесь была бы проверка в базе данных
    echo json_encode(['success' => true, 'message' => 'Login successful']);
} elseif ($action === 'register') {
    echo json_encode(['success' => true, 'message' => 'Registration successful']);
}
?>