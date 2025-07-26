<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            // Admin users
            [
                'name' => 'Super Admin',
                'email' => 'admin@pabu.org',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'branch_id' => null,
                'team_id' => null
            ],
            // Branch managers
            [
                'name' => 'Manager Jakarta Pusat',
                'email' => 'manager.jakarta@pabu.org',
                'password' => Hash::make('password'),
                'role' => 'branch',
                'branch_id' => 1,
                'team_id' => null
            ],
            [
                'name' => 'Manager Bandung',
                'email' => 'manager.bandung@pabu.org',
                'password' => Hash::make('password'),
                'role' => 'BRANCH',
                'branch_id' => 2,
                'team_id' => null
            ],
            [
                'name' => 'Manager Surabaya',
                'email' => 'manager.surabaya@pabu.org',
                'password' => Hash::make('password'),
                'role' => 'BRANCH',
                'branch_id' => 3,
                'team_id' => null
            ],
            [
                'name' => 'Manager Medan',
                'email' => 'manager.medan@pabu.org',
                'password' => Hash::make('password'),
                'role' => 'BRANCH',
                'branch_id' => 4,
                'team_id' => null
            ],
            // Volunteers
            [
                'name' => 'Ahmad Volunteer',
                'email' => 'ahmad@pabu.org',
                'phone' => '081234567890',
                'password' => Hash::make('password'),
                'role' => 'volunteer',
                'branch_id' => 1,
                'team_id' => 1
            ],
            [
                'name' => 'Siti Volunteer',
                'email' => 'siti@pabu.org',
                'phone' => '081234567891',
                'password' => Hash::make('password'),
                'role' => 'VOLUNTEER',
                'branch_id' => 1,
                'team_id' => 2
            ],
            [
                'name' => 'Budi Volunteer',
                'email' => 'budi@pabu.org',
                'phone' => '081234567892',
                'password' => Hash::make('password'),
                'role' => 'VOLUNTEER',
                'branch_id' => 2,
                'team_id' => 3
            ],
            [
                'name' => 'Rina Volunteer',
                'email' => 'rina@pabu.org',
                'phone' => '081234567893',
                'password' => Hash::make('password'),
                'role' => 'VOLUNTEER',
                'branch_id' => 2,
                'team_id' => 4
            ]
        ];

        foreach ($users as $user) {
            User::create($user);
        }
    }
}
