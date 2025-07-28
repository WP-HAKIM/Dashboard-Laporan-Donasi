<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Transaction;
use App\Models\Program;

class UpdateTransactionRates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'transactions:update-rates {--force : Force update all transactions}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update volunteer_rate and branch_rate in existing transactions based on their programs';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting transaction rates update...');
        
        $force = $this->option('force');
        
        // Get all transactions
        $query = Transaction::with('program');
        
        if (!$force) {
            // Only update transactions where rates are null or 0
            $query->where(function($q) {
                $q->whereNull('volunteer_rate')
                  ->orWhereNull('branch_rate')
                  ->orWhere('volunteer_rate', 0)
                  ->orWhere('branch_rate', 0)
                  ->orWhereNull('ziswaf_volunteer_rate')
                  ->orWhereNull('ziswaf_branch_rate')
                  ->orWhere('ziswaf_volunteer_rate', 0)
                  ->orWhere('ziswaf_branch_rate', 0);
            });
        }
        
        $transactions = $query->get();
        
        if ($transactions->isEmpty()) {
            $this->info('No transactions found to update.');
            return 0;
        }
        
        $this->info("Found {$transactions->count()} transactions to update.");
        
        $progressBar = $this->output->createProgressBar($transactions->count());
        $progressBar->start();
        
        $updated = 0;
        
        foreach ($transactions as $transaction) {
            $program = $transaction->program;
            
            if ($program) {
                // Update main program rates
                $transaction->update([
                    'volunteer_rate' => $program->volunteer_rate,
                    'branch_rate' => $program->branch_rate,
                ]);
                $updated++;
            }
            
            // Also check for ziswaf_program_id
            if ($transaction->ziswaf_program_id) {
                $ziswafProgram = Program::find($transaction->ziswaf_program_id);
                if ($ziswafProgram) {
                    $transaction->update([
                        'ziswaf_volunteer_rate' => $ziswafProgram->volunteer_rate,
                        'ziswaf_branch_rate' => $ziswafProgram->branch_rate,
                    ]);
                }
            }
            
            $progressBar->advance();
        }
        
        $progressBar->finish();
        $this->newLine();
        
        $this->info("Successfully updated rates for {$updated} transactions.");
        
        return 0;
    }
}