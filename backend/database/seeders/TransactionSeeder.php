<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Transaction;
use App\Models\Branch;
use App\Models\Team;
use App\Models\Program;
use App\Models\User;
use Carbon\Carbon;

class TransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ambil data yang diperlukan
        $branches = Branch::all();
        $teams = Team::all();
        $programs = Program::all();
        $users = User::all();

        if ($branches->isEmpty() || $teams->isEmpty() || $programs->isEmpty() || $users->isEmpty()) {
            $this->command->warn('Pastikan data branches, teams, programs, dan users sudah ada sebelum menjalankan TransactionSeeder');
            return;
        }

        $transferMethods = ['bank_transfer', 'e_wallet', 'cash', 'qris'];
        $statuses = ['pending', 'valid', 'double_duta', 'double_input', 'not_in_account', 'other'];
        $donorNames = [
            'Ahmad Rizki', 'Siti Nurhaliza', 'Budi Santoso', 'Dewi Sartika', 'Eko Prasetyo',
            'Fitri Handayani', 'Gunawan Wijaya', 'Hesti Purnamasari', 'Indra Kusuma', 'Joko Widodo',
            'Kartika Sari', 'Lukman Hakim', 'Maya Sari', 'Nanda Pratama', 'Oki Setiana',
            'Putri Maharani', 'Qori Sandioriva', 'Rini Soemarno', 'Sandi Uno', 'Titi Kamal'
        ];

        // Generate 50 transaksi dummy
        for ($i = 1; $i <= 50; $i++) {
            $createdAt = Carbon::now()->subDays(rand(0, 90)); // Transaksi dalam 90 hari terakhir
            $transactionDate = $createdAt->copy()->subDays(rand(0, 7)); // Tanggal transaksi bisa berbeda dari input
            $status = $statuses[array_rand($statuses)];
            $validatedAt = null;
            $validatedBy = null;
            
            // Pilih program dan ambil rate-nya
            $selectedProgram = $programs->random();
            $programType = ['ZISWAF', 'QURBAN'][array_rand(['ZISWAF', 'QURBAN'])];

            // Jika status valid, set validated_at dan validated_by
            if ($status === 'valid') {
                $validatedAt = $createdAt->copy()->addHours(rand(1, 48));
                $validatedBy = $users->random()->id;
            }

            Transaction::create([
                'branch_id' => $branches->random()->id,
                'team_id' => $teams->random()->id,
                'volunteer_id' => $users->random()->id,
                'program_type' => $programType,
                'program_id' => $selectedProgram->id,
                'donor_name' => $donorNames[array_rand($donorNames)],
                'amount' => rand(50000, 5000000), // Donasi antara 50rb - 5jt
                'transaction_date' => $transactionDate,
                'volunteer_rate' => $selectedProgram->volunteer_rate,
                'branch_rate' => $selectedProgram->branch_rate,
                'transfer_method' => $transferMethods[array_rand($transferMethods)],
                'proof_image' => 'proof_' . $i . '.jpg',
                'status' => $status,
                'status_reason' => $status !== 'valid' ? 'Alasan status: ' . $status : null,
                'validated_at' => $validatedAt,
                'validated_by' => $validatedBy,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }

        $this->command->info('50 transaksi dummy berhasil dibuat!');
    }
}
