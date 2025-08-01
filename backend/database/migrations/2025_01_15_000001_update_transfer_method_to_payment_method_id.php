<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, create payment methods if they don't exist
        $paymentMethods = [
            ['name' => 'Bank Transfer', 'description' => 'Transfer melalui bank', 'is_active' => true],
            ['name' => 'E-Wallet', 'description' => 'Pembayaran melalui dompet digital', 'is_active' => true],
            ['name' => 'Cash', 'description' => 'Pembayaran tunai', 'is_active' => true],
            ['name' => 'QRIS', 'description' => 'Pembayaran melalui QRIS', 'is_active' => true],
        ];

        foreach ($paymentMethods as $method) {
            DB::table('payment_methods')->updateOrInsert(
                ['name' => $method['name']],
                $method + ['created_at' => now(), 'updated_at' => now()]
            );
        }

        Schema::table('transactions', function (Blueprint $table) {
            // Add new payment_method_id column
            $table->foreignId('payment_method_id')->nullable()->constrained('payment_methods')->onDelete('cascade');
        });

        // Migrate existing data
        $transactions = DB::table('transactions')->get();
        foreach ($transactions as $transaction) {
            $paymentMethodName = $transaction->transfer_method;
            
            // Try to find matching payment method
            $paymentMethod = DB::table('payment_methods')
                ->where('name', 'like', '%' . $paymentMethodName . '%')
                ->orWhere('name', $paymentMethodName)
                ->first();
            
            if (!$paymentMethod) {
                // Create new payment method if not found
                $paymentMethodId = DB::table('payment_methods')->insertGetId([
                    'name' => $paymentMethodName,
                    'description' => 'Migrated from transfer_method',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } else {
                $paymentMethodId = $paymentMethod->id;
            }
            
            // Update transaction with payment_method_id
            DB::table('transactions')
                ->where('id', $transaction->id)
                ->update(['payment_method_id' => $paymentMethodId]);
        }

        // Make payment_method_id required after migration
        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('payment_method_id')->nullable(false)->change();
        });

        // Drop old transfer_method column
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('transfer_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Add back transfer_method column
            $table->string('transfer_method')->after('amount');
        });

        // Migrate data back
        $transactions = DB::table('transactions')
            ->join('payment_methods', 'transactions.payment_method_id', '=', 'payment_methods.id')
            ->select('transactions.id', 'payment_methods.name')
            ->get();

        foreach ($transactions as $transaction) {
            DB::table('transactions')
                ->where('id', $transaction->id)
                ->update(['transfer_method' => $transaction->name]);
        }

        Schema::table('transactions', function (Blueprint $table) {
            // Drop foreign key and column
            $table->dropForeign(['payment_method_id']);
            $table->dropColumn('payment_method_id');
        });
    }
};