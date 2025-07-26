<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $paymentMethods = [
            ['name' => 'BRI', 'description' => 'Bank Rakyat Indonesia', 'is_active' => true],
            ['name' => 'BSI', 'description' => 'Bank Syariah Indonesia', 'is_active' => true],
            ['name' => 'BCA', 'description' => 'Bank Central Asia', 'is_active' => true],
            ['name' => 'Mandiri', 'description' => 'Bank Mandiri', 'is_active' => true],
            ['name' => 'BNI', 'description' => 'Bank Negara Indonesia', 'is_active' => true],
            ['name' => 'CIMB Niaga', 'description' => 'Bank CIMB Niaga', 'is_active' => true],
            ['name' => 'Danamon', 'description' => 'Bank Danamon', 'is_active' => true],
        ];

        foreach ($paymentMethods as $method) {
            PaymentMethod::create($method);
        }
    }
}
