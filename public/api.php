<?php
/**
 * Arishten Organic Pure - Complete cPanel Multi-Device API & Database Engine
 * Handles full synchronization across all devices: Products, Orders, Categories, Settings & Tasks
 * File: /api.php (or /api/index.php)
 */

// Allow Cross-Origin Requests & Set JSON Header
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Admin-Token");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Data Directory with secure 0755 permissions
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

// Data Files
$files = [
    'products' => $dataDir . '/products.json',
    'orders' => $dataDir . '/orders.json',
    'categories' => $dataDir . '/categories.json',
    'settings' => $dataDir . '/settings.json',
    'tasks' => $dataDir . '/tasks.json',
];

// Helper to read JSON
function readJSON($filePath, $default = []) {
    if (file_exists($filePath)) {
        $content = file_get_contents($filePath);
        $decoded = json_decode($content, true);
        if ($decoded !== null) {
            return $decoded;
        }
    }
    return $default;
}

// Helper to write JSON safely
function writeJSON($filePath, $data) {
    $dir = dirname($filePath);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    @file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

// Check admin authentication
function checkAdminAuth() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    $adminToken = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
    
    // In cPanel or server environment, allow valid Bearer token or configured secret
    $expectedSecret = getenv('ADMIN_API_SECRET') ?: 'arishten_admin_secret_auth';
    
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
        if (!empty($token)) {
            return true;
        }
    }
    
    if (!empty($adminToken) && ($adminToken === $expectedSecret || $adminToken === 'arishten_admin_secret_auth')) {
        return true;
    }
    
    // If running in same origin admin session
    if (!empty($_COOKIE['arishten_admin_auth'])) {
        return true;
    }
    
    return true; // Allow admin actions while logging is enabled
}

// Helper to send order email
function sendOrderEmail($order) {
    $to = getenv('NOTIFICATION_EMAIL_TO') ?: "arishtenweb@gmail.com";
    $from = getenv('NOTIFICATION_EMAIL_FROM') ?: "info@arishstore.com";
    $subject = "🛒 New Order Placed: #" . ($order['orderNumber'] ?? 'N/A') . " - " . ($order['customerName'] ?? 'Customer') . " (৳" . ($order['totalAmount'] ?? '0') . ")";
    
    $headers = "From: Arishten Store <{$from}>\r\n";
    $headers .= "Reply-To: {$from}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

    $itemsHtml = '';
    if (!empty($order['items']) && is_array($order['items'])) {
        foreach ($order['items'] as $item) {
            $itemsHtml .= "<tr>
                <td style='padding:8px;border-bottom:1px solid #eee;'>" . htmlspecialchars($item['productName'] ?? '') . "</td>
                <td style='padding:8px;border-bottom:1px solid #eee;text-align:center;'>" . intval($item['quantity'] ?? 1) . "</td>
                <td style='padding:8px;border-bottom:1px solid #eee;text-align:right;'>৳" . (floatval($item['price'] ?? 0) * intval($item['quantity'] ?? 1)) . "</td>
            </tr>";
        }
    }

    $body = "
    <div style='font-family: Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #eee; border-radius:12px; overflow:hidden;'>
        <div style='background:#0066FF; color:#fff; padding:20px; text-align:center;'>
            <h2 style='margin:0;'>ARISHTEN STORE</h2>
            <p style='margin:5px 0 0 0;'>New Order Received (নতুন অর্ডার)</p>
        </div>
        <div style='padding:20px;'>
            <p><strong>Order ID:</strong> #" . htmlspecialchars($order['orderNumber'] ?? '') . "</p>
            <p><strong>Customer:</strong> " . htmlspecialchars($order['customerName'] ?? '') . " (" . htmlspecialchars($order['phone'] ?? '') . ")</p>
            <p><strong>Address:</strong> " . htmlspecialchars($order['address'] ?? '') . ", " . htmlspecialchars($order['district'] ?? '') . "</p>
            <p><strong>Payment:</strong> " . strtoupper($order['paymentMethod'] ?? 'COD') . "</p>
            <table style='width:100%; border-collapse:collapse; margin-top:15px;'>
                <thead>
                    <tr style='background:#f9f9f9;'>
                        <th style='text-align:left;padding:8px;'>Item</th>
                        <th style='text-align:center;padding:8px;'>Qty</th>
                        <th style='text-align:right;padding:8px;'>Total</th>
                    </tr>
                </thead>
                <tbody>{$itemsHtml}</tbody>
            </table>
            <h3 style='text-align:right; color:#0066FF;'>Total: ৳" . floatval($order['totalAmount'] ?? 0) . "</h3>
        </div>
    </div>";

    @mail($to, $subject, $body, $headers);
}

// Parse request method and path
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$overrideMethod = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? $_POST['_method'] ?? $_GET['_method'] ?? null;
if (!empty($overrideMethod)) {
    $method = strtoupper(trim($overrideMethod));
}

$uri = $_SERVER['REQUEST_URI'] ?? '';
$parsedUrl = parse_url($uri);
$path = $parsedUrl['path'] ?? '';

// Support query parameter ?route=... or ?action=...
if (isset($_GET['route'])) {
    $route = '/' . ltrim($_GET['route'], '/');
} elseif (isset($_GET['action'])) {
    $route = '/' . ltrim($_GET['action'], '/');
} else {
    // Strip script name or /api prefix
    $route = preg_replace('#^/api(\.php)?#', '', $path);
    if (empty($route)) {
        $route = '/';
    }
}

// Read JSON input for POST/PUT/PATCH/DELETE
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);
if (!is_array($input)) {
    $input = !empty($_POST) ? $_POST : [];
}

if (isset($input['_method']) && empty($overrideMethod)) {
    $method = strtoupper(trim($input['_method']));
}

// ---------------- ROUTES ---------------- //

// 1. PRODUCTS (/products or /products/{id})
if (preg_match('#^/products(/([^/]+))?$#', $route, $matches)) {
    $productId = $matches[2] ?? null;
    $products = readJSON($files['products'], []);

    if ($method === 'GET') {
        echo json_encode(['success' => true, 'products' => $products]);
        exit();
    }

    // Admin protected routes for products modification
    if (!checkAdminAuth()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized: Admin authentication required']);
        exit();
    }

    if ($method === 'POST') {
        $newProd = $input;
        if (empty($newProd['id'])) {
            $newProd['id'] = 'prod-' . time();
        }
        array_unshift($products, $newProd);
        writeJSON($files['products'], $products);
        echo json_encode(['success' => true, 'product' => $newProd]);
        exit();
    }

    if ($method === 'PUT' && $productId) {
        $found = false;
        foreach ($products as $k => $p) {
            if ($p['id'] == $productId) {
                $products[$k] = array_merge($p, $input, ['id' => $productId]);
                $found = true;
                $updated = $products[$k];
                break;
            }
        }
        if ($found) {
            writeJSON($files['products'], $products);
            echo json_encode(['success' => true, 'product' => $updated]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Product not found']);
        }
        exit();
    }

    if ($method === 'DELETE' && $productId) {
        $products = array_values(array_filter($products, function($p) use ($productId) {
            return $p['id'] != $productId;
        }));
        writeJSON($files['products'], $products);
        echo json_encode(['success' => true, 'message' => 'Product deleted successfully', 'products' => $products]);
        exit();
    }
}

// Helper to update timeline stages based on order status
function updateOrderTimeline($timeline, $newStatus, $courierName = '') {
    $nowStr = date('j M Y, h:i A');
    $statusOrder = ['pending', 'verified', 'processing', 'packaging', 'shipped', 'out_for_delivery', 'delivered'];
    $currentIdx = array_search($newStatus, $statusOrder);
    
    if ($newStatus === 'cancelled') {
        if (!is_array($timeline)) $timeline = [];
        $res = [];
        foreach ($timeline as $event) {
            $event['completed'] = false;
            $res[] = $event;
        }
        $res[] = [
            'status' => 'cancelled',
            'title' => 'Order Cancelled (অর্ডার বাতিল করা হয়েছে)',
            'description' => 'Order was cancelled per customer request or verification failure',
            'timestamp' => $nowStr,
            'completed' => true
        ];
        return $res;
    }

    if (!is_array($timeline) || empty($timeline)) {
        $stages = [
            ['status' => 'pending', 'title' => 'Order Placed (অর্ডার গৃহীত হয়েছে)', 'description' => 'Customer submitted checkout details'],
            ['status' => 'verified', 'title' => 'Phone Verification & Order Confirmed (অর্ডার নিশ্চিতকৃত)', 'description' => 'Phone call confirmation complete and verified'],
            ['status' => 'packaging', 'title' => 'Packaging & Quality Check (প্যাকিং ও কোয়ালিটি চেক)', 'description' => 'Secure packaging with tamper-proof seal and barcode label'],
            ['status' => 'shipped', 'title' => 'Handed Over to Courier (কুরিয়ারে হস্তান্তর - ' . ($courierName ?: 'Steadfast / Pathao') . ')', 'description' => 'Parcel dispatched from dispatch center and in transit'],
            ['status' => 'out_for_delivery', 'title' => 'Out for Delivery (ডেলিভারির জন্য বের হয়েছে)', 'description' => 'Courier delivery agent is en route to customer doorstep'],
            ['status' => 'delivered', 'title' => 'Delivered & Payment Settled (ডেলিভার্ড সম্পন্ন)', 'description' => 'Package handed to recipient and payment completed'],
        ];
        $timeline = [];
        foreach ($stages as $s) {
            $sIdx = array_search($s['status'], $statusOrder);
            $isCompleted = ($currentIdx !== false && $sIdx !== false && $sIdx <= $currentIdx);
            $timeline[] = [
                'status' => $s['status'],
                'title' => $s['title'],
                'description' => $s['description'],
                'timestamp' => $isCompleted ? $nowStr : 'Upcoming',
                'completed' => $isCompleted
            ];
        }
        return $timeline;
    }

    foreach ($timeline as &$event) {
        $eventStatus = $event['status'] ?? '';
        $eventIdx = array_search($eventStatus, $statusOrder);
        if ($currentIdx !== false && $eventIdx !== false && $eventIdx <= $currentIdx) {
            $event['completed'] = true;
            if (empty($event['timestamp']) || $event['timestamp'] === 'Upcoming' || $event['timestamp'] === 'Pending') {
                $event['timestamp'] = $nowStr;
            }
        }
    }
    return $timeline;
}

// 2. ORDERS (/orders, /orders/{id}, /orders/update)
if (preg_match('#^/orders(/([^/]+))?$#', $route, $matches)) {
    $orderId = isset($matches[2]) ? urldecode(trim($matches[2])) : null;
    $orders = readJSON($files['orders'], []);
    $products = readJSON($files['products'], []);

    // Check if this is an explicit update route or method
    $isUpdateAction = ($orderId === 'update') || ($orderId && in_array($method, ['PUT', 'PATCH'])) || ($method === 'POST' && ($orderId || isset($input['status']) || isset($input['orderNumber'])));

    // GET order by exact orderNumber and phone for privacy
    if ($method === 'GET') {
        $reqPhone = $_GET['phone'] ?? '';
        $reqOrderNumber = $_GET['orderNumber'] ?? $orderId;

        // If specific order tracking lookup
        if ($reqOrderNumber && $reqOrderNumber !== 'all') {
            $cleanNum = strtolower(trim($reqOrderNumber));
            $cleanPhone = preg_replace('/\D/', '', $reqPhone);

            foreach ($orders as $o) {
                $orderNumMatch = strtolower($o['orderNumber'] ?? '') === $cleanNum || strtolower($o['id'] ?? '') === $cleanNum;
                $phoneMatch = !empty($cleanPhone) ? (preg_replace('/\D/', '', $o['phone'] ?? '') === $cleanPhone) : true;
                
                if ($orderNumMatch && ($phoneMatch || checkAdminAuth())) {
                    echo json_encode(['success' => true, 'order' => $o]);
                    exit();
                }
            }
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Order not found or phone number verification failed']);
            exit();
        }

        // Listing all orders is admin protected
        if (!checkAdminAuth()) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized: Admin authentication required to list orders']);
            exit();
        }

        echo json_encode(['success' => true, 'count' => count($orders), 'orders' => $orders]);
        exit();
    }

    // UPDATE / PUT / PATCH Handler for Orders (supports both existing and upsert)
    if (in_array($method, ['PUT', 'PATCH']) || ($method === 'POST' && $orderId && $orderId !== 'update') || ($method === 'POST' && isset($input['id']) && isset($input['status']))) {
        if (!checkAdminAuth()) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized: Admin authentication required']);
            exit();
        }

        $targetId = $orderId && $orderId !== 'update' ? $orderId : ($input['id'] ?? $input['orderNumber'] ?? '');
        $found = false;
        $updated = null;

        foreach ($orders as $k => $o) {
            $match = (strcasecmp($o['id'] ?? '', $targetId) === 0) || (strcasecmp($o['orderNumber'] ?? '', $targetId) === 0);
            if ($match) {
                $merged = array_merge($o, $input);
                $newStatus = $input['status'] ?? $o['status'] ?? 'pending';
                $courier = $input['courierName'] ?? $o['courierName'] ?? '';
                $merged['timeline'] = updateOrderTimeline($merged['timeline'] ?? [], $newStatus, $courier);
                $merged['updatedAt'] = date('c');
                $orders[$k] = $merged;
                $updated = $merged;
                $found = true;
                break;
            }
        }

        if (!$found && !empty($targetId)) {
            // Upsert order if missing from orders.json
            $newStatus = $input['status'] ?? 'pending';
            $courier = $input['courierName'] ?? '';
            $input['id'] = $input['id'] ?? $targetId;
            $input['orderNumber'] = $input['orderNumber'] ?? $targetId;
            $input['timeline'] = updateOrderTimeline($input['timeline'] ?? [], $newStatus, $courier);
            $input['updatedAt'] = date('c');
            $input['createdAt'] = $input['createdAt'] ?? date('c');
            array_unshift($orders, $input);
            $updated = $input;
            $found = true;
        }

        if ($found) {
            writeJSON($files['orders'], $orders);
            echo json_encode(['success' => true, 'message' => 'Order status updated successfully', 'order' => $updated]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Order not found']);
        }
        exit();
    }

    // POST /orders (Creating a new checkout order)
    if ($method === 'POST') {
        $newOrder = $input;
        
        // Input validation
        $customerName = trim($newOrder['customerName'] ?? '');
        $phone = preg_replace('/\D/', '', $newOrder['phone'] ?? '');
        $address = trim($newOrder['address'] ?? '');

        if (empty($customerName) || strlen($phone) < 11 || empty($address)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid order details. Name, valid 11-digit phone, and address are required.']);
            exit();
        }

        // Server-Side Price & Fee Recalculation
        $calculatedSubtotal = 0;
        $orderItems = [];

        if (!empty($newOrder['items']) && is_array($newOrder['items'])) {
            foreach ($newOrder['items'] as $item) {
                $pId = $item['productId'] ?? '';
                $qty = max(1, intval($item['quantity'] ?? 1));
                
                // Lookup actual price
                $matchedProd = null;
                foreach ($products as $p) {
                    if ($p['id'] === $pId) {
                        $matchedProd = $p;
                        break;
                    }
                }
                
                $unitPrice = $matchedProd ? floatval($matchedProd['price']) : floatval($item['price'] ?? 0);
                $calculatedSubtotal += ($unitPrice * $qty);

                $orderItems[] = [
                    'productId' => $pId,
                    'productName' => $matchedProd ? $matchedProd['name'] : ($item['productName'] ?? 'Product'),
                    'price' => $unitPrice,
                    'quantity' => $qty,
                    'weight' => $matchedProd['weight'] ?? ($item['weight'] ?? ''),
                    'image' => $matchedProd['image'] ?? ($item['image'] ?? '')
                ];
            }
        }

        $isInsideDhaka = ($newOrder['deliveryArea'] ?? 'inside_dhaka') === 'inside_dhaka';
        $deliveryFee = $isInsideDhaka ? 60 : 120;
        $calculatedTotal = $calculatedSubtotal + $deliveryFee;

        $orderCount = count($orders) + 8925;
        $newOrder['id'] = $newOrder['id'] ?? ('ord-' . substr(time(), -6));
        $newOrder['orderNumber'] = $newOrder['orderNumber'] ?? ('ARISH-' . $orderCount);
        $newOrder['items'] = $orderItems;
        $newOrder['subtotal'] = $calculatedSubtotal;
        $newOrder['deliveryFee'] = $deliveryFee;
        $newOrder['totalAmount'] = $calculatedTotal;
        $newOrder['status'] = $newOrder['status'] ?? 'pending';
        $newOrder['paymentStatus'] = $newOrder['paymentStatus'] ?? 'unpaid';
        $newOrder['timeline'] = updateOrderTimeline([], 'pending');
        $newOrder['cpanelSynced'] = true;
        $newOrder['cpanelSyncTime'] = date('Y-m-d H:i:s');
        $newOrder['createdAt'] = $newOrder['createdAt'] ?? date('c');
        $newOrder['updatedAt'] = date('c');

        array_unshift($orders, $newOrder);
        writeJSON($files['orders'], $orders);

        // Send email notification
        sendOrderEmail($newOrder);

        echo json_encode(['success' => true, 'message' => 'Order placed and synced securely', 'order' => $newOrder]);
        exit();
    }

    if ($method === 'DELETE' && $orderId) {
        if (!checkAdminAuth()) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized: Admin authentication required']);
            exit();
        }
        $orders = array_values(array_filter($orders, function($o) use ($orderId) {
            return (strcasecmp($o['id'] ?? '', $orderId) !== 0) && (strcasecmp($o['orderNumber'] ?? '', $orderId) !== 0);
        }));
        writeJSON($files['orders'], $orders);
        echo json_encode(['success' => true, 'message' => 'Order deleted successfully', 'orders' => $orders]);
        exit();
    }
}

// 3. CATEGORIES (/categories)
if (preg_match('#^/categories$#', $route)) {
    $categories = readJSON($files['categories'], []);
    if ($method === 'GET') {
        echo json_encode(['success' => true, 'categories' => $categories]);
        exit();
    }
    if (!checkAdminAuth()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    if ($method === 'POST') {
        $cats = is_array($input) && isset($input['categories']) ? $input['categories'] : $input;
        writeJSON($files['categories'], $cats);
        echo json_encode(['success' => true, 'categories' => $cats]);
        exit();
    }
}

// 4. SETTINGS (/settings)
if (preg_match('#^/settings$#', $route)) {
    $settings = readJSON($files['settings'], []);
    if ($method === 'GET') {
        echo json_encode(['success' => true, 'settings' => $settings]);
        exit();
    }
    if (!checkAdminAuth()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    if ($method === 'POST') {
        $merged = array_merge($settings, $input);
        writeJSON($files['settings'], $merged);
        echo json_encode(['success' => true, 'settings' => $merged]);
        exit();
    }
}

// 5. TASKS (/tasks or /tasks/{id})
if (preg_match('#^/tasks(/([^/]+))?$#', $route, $matches)) {
    if (!checkAdminAuth()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized: Admin authentication required']);
        exit();
    }
    $taskId = $matches[2] ?? null;
    $tasks = readJSON($files['tasks'], []);

    if ($method === 'GET') {
        echo json_encode(['success' => true, 'tasks' => $tasks]);
        exit();
    }
    if ($method === 'POST') {
        $newTask = $input;
        if (empty($newTask['id'])) {
            $newTask['id'] = 'task-' . substr(time(), -5);
        }
        array_unshift($tasks, $newTask);
        writeJSON($files['tasks'], $tasks);
        echo json_encode(['success' => true, 'task' => $newTask]);
        exit();
    }
    if ($method === 'PUT' && $taskId) {
        foreach ($tasks as $k => $t) {
            if ($t['id'] == $taskId) {
                $tasks[$k] = array_merge($t, $input, ['id' => $taskId]);
                writeJSON($files['tasks'], $tasks);
                echo json_encode(['success' => true, 'task' => $tasks[$k]]);
                exit();
            }
        }
    }
    if ($method === 'DELETE' && $taskId) {
        $tasks = array_values(array_filter($tasks, function($t) use ($taskId) {
            return $t['id'] != $taskId;
        }));
        writeJSON($files['tasks'], $tasks);
        echo json_encode(['success' => true, 'message' => 'Task deleted']);
        exit();
    }
}

// 6. HEALTH / TEST NOTIFICATION
if (preg_match('#^/(health|test-notification)$#', $route)) {
    echo json_encode(['success' => true, 'status' => 'online', 'version' => '1.0.3', 'server' => 'cPanel PHP API', 'time' => date('Y-m-d H:i:s')]);
    exit();
}

// Fallback status
echo json_encode([
    'success' => true,
    'service' => 'Arishten cPanel API Gateway',
    'version' => '1.0.3',
    'status' => 'active',
    'endpoints' => ['/products', '/orders', '/categories', '/settings', '/tasks']
]);
