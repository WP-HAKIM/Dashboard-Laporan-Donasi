<?php

namespace Database\Seeders;

use App\Models\Team;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TeamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $teams = [
            // Jakarta Pusat teams
            [
                'name' => 'Tim Ziswaf Jakarta Pusat',
                'branch_id' => 1,
                'code' => 'TZJ-001'
            ],
            [
                'name' => 'Tim Qurban Jakarta Pusat',
                'branch_id' => 1,
                'code' => 'TQJ-001'
            ],
            // Bandung teams
            [
                'name' => 'Tim Ziswaf Bandung',
                'branch_id' => 2,
                'code' => 'TZB-001'
            ],
            [
                'name' => 'Tim Qurban Bandung',
                'branch_id' => 2,
                'code' => 'TQB-001'
            ],
            // Surabaya teams
            [
                'name' => 'Tim Ziswaf Surabaya',
                'branch_id' => 3,
                'code' => 'TZS-001'
            ],
            [
                'name' => 'Tim Qurban Surabaya',
                'branch_id' => 3,
                'code' => 'TQS-001'
            ],
            // Medan teams
            [
                'name' => 'Tim Ziswaf Medan',
                'branch_id' => 4,
                'code' => 'TZM-001'
            ],
            [
                'name' => 'Tim Qurban Medan',
                'branch_id' => 4,
                'code' => 'TQM-001'
            ]
        ];

        foreach ($teams as $team) {
            Team::create($team);
        }
    }
}
