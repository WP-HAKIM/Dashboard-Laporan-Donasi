<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Console\Commands\UpdateTransactionRates;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Register custom commands
Artisan::command('transactions:update-rates {--force : Force update all transactions}', function () {
    return $this->call(UpdateTransactionRates::class);
})->purpose('Update volunteer_rate and branch_rate in existing transactions based on their programs');
