<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Transaction;

echo "Total transactions before: " . Transaction::count() . "\n";

$transaction = Transaction::first();
if ($transaction) {
    echo "Found transaction ID: " . $transaction->id . "\n";
    $transaction->delete();
    echo "Transaction deleted successfully\n";
    echo "Total transactions after: " . Transaction::count() . "\n";
} else {
    echo "No transactions found\n";
}