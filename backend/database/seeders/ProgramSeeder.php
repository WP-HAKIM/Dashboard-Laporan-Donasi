<?php

namespace Database\Seeders;

use App\Models\Program;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProgramSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $programs = [
            [
                'type' => 'ZISWAF',
                'name' => 'Zakat Fitrah',
                'code' => 'ZF-001',
                'description' => 'Program pengumpulan zakat fitrah untuk membantu masyarakat kurang mampu',
                'volunteer_rate' => 5.0,
                'branch_rate' => 10.0
            ],
            [
                'type' => 'ZISWAF',
                'name' => 'Zakat Mal',
                'code' => 'ZM-001',
                'description' => 'Program pengumpulan zakat mal untuk pemberdayaan ekonomi umat',
                'volunteer_rate' => 5.0,
                'branch_rate' => 10.0
            ],
            [
                'type' => 'ZISWAF',
                'name' => 'Infaq Sedekah',
                'code' => 'IS-001',
                'description' => 'Program pengumpulan infaq dan sedekah untuk berbagai kegiatan sosial',
                'volunteer_rate' => 7.5,
                'branch_rate' => 12.5
            ],
            [
                'type' => 'QURBAN',
                'name' => 'Qurban Kambing',
                'code' => 'QK-001',
                'description' => 'Program qurban kambing untuk dibagikan kepada masyarakat',
                'volunteer_rate' => 3.0,
                'branch_rate' => 7.0
            ],
            [
                'type' => 'QURBAN',
                'name' => 'Qurban Sapi',
                'code' => 'QS-001',
                'description' => 'Program qurban sapi untuk dibagikan kepada masyarakat',
                'volunteer_rate' => 2.5,
                'branch_rate' => 5.0
            ]
        ];

        foreach ($programs as $program) {
            Program::create($program);
        }
    }
}
