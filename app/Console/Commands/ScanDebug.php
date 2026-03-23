<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ScanDebug extends Command
{
    protected $signature = 'debug:scan';
    protected $description = 'Scan for debug statements in controllers';

    public function handle()
    {
        $patterns = [
            'dd(',
            'dump(',
            'var_dump(',
            'Log::debug(',
            'Log::info(',
            'Log::warning(',
            'Log::error(',
            'logger(',
            'ray(',
            '->dump(',
            '->dd('
        ];

        $controllersPath = app_path('Http/Controllers');
        $files = File::allFiles($controllersPath);
        
        $found = [];
        
        foreach ($files as $file) {
            $content = File::get($file);
            $lineNumber = 1;
            $lines = explode("\n", $content);
            
            foreach ($lines as $line) {
                foreach ($patterns as $pattern) {
                    if (str_contains($line, $pattern)) {
                        $found[] = [
                            'file' => $file->getRelativePathname(),
                            'line' => $lineNumber,
                            'code' => trim($line),
                            'pattern' => $pattern
                        ];
                    }
                }
                $lineNumber++;
            }
        }
        
        if (empty($found)) {
            $this->info('✅ No debug statements found!');
            return 0;
        }
        
        $this->warn('⚠️  Found debug statements:');
        $this->newLine();
        
        foreach ($found as $item) {
            $this->line("📁 {$item['file']}:{$item['line']}");
            $this->line("   🔍 Pattern: {$item['pattern']}");
            $this->error("   💀 {$item['code']}");
            $this->newLine();
        }
        
        $this->warn("Total: " . count($found) . " debug statements found.");
        
        return 1;
    }
}