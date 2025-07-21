<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Tymon\JWTAuth\Facades\JWTAuth;

class GenerateTestToken extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'token:generate {--user=owner@salon.com : Email of the user to generate token for}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a JWT token for testing purposes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->option('user');
        
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("User with email {$email} not found");
            return 1;
        }
        
        try {
            $token = JWTAuth::fromUser($user);
            
            $this->info("JWT Token for {$user->full_name} ({$user->email}):");
            $this->line($token);
            $this->line('');
            $this->info('You can use this token in the Authorization header:');
            $this->line("Authorization: Bearer {$token}");
            $this->line('');
            $this->info('Or set it in localStorage:');
            $this->line("localStorage.setItem('access_token', '{$token}');");
            
            return 0;
        } catch (\Exception $e) {
            $this->error("Failed to generate token: " . $e->getMessage());
            return 1;
        }
    }
}
