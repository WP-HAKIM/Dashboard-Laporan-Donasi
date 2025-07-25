<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = [
            [
                'name' => 'Cabang Jakarta Pusat',
                'code' => 'JKT-PST',
                'address' => 'Jl. Sudirman No. 123, Jakarta Pusat'
            ],
            [
                'name' => 'Cabang Bandung',
                'code' => 'BDG',
                'address' => 'Jl. Asia Afrika No. 45, Bandung'
            ],
            [
                'name' => 'Cabang Surabaya',
                'code' => 'SBY',
                'address' => 'Jl. Pemuda No. 67, Surabaya'
            ],
            [
                'name' => 'Cabang Medan',
                'code' => 'MDN',
                'address' => 'Jl. Gatot Subroto No. 89, Medan'
            ]
        ];

        foreach ($branches as $branch) {
            Branch::create($branch);
        }
    }
}
