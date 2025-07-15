<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequestLoggingMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = Str::uuid()->toString();
        $startTime = microtime(true);
        
        // Add request ID to log context
        Log::withContext(['request_id' => $requestId]);
        
        // Log incoming request
        Log::info('API Request Started', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'uri' => $request->getRequestUri(),
            'user_id' => auth()->id(),
            'user_email' => auth()->user()->email ?? null,
            'user_role' => auth()->user()->role ?? null,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'headers' => $this->getFilteredHeaders($request),
            'query_params' => $request->query(),
            'body_size' => strlen($request->getContent()),
            'timestamp' => now()->toISOString()
        ]);
        
        // Log request body for POST/PUT/PATCH requests (excluding sensitive data)
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH'])) {
            $body = $request->all();
            
            // Filter out sensitive data
            $sensitiveFields = ['password', 'password_confirmation', 'token', 'secret'];
            foreach ($sensitiveFields as $field) {
                if (isset($body[$field])) {
                    $body[$field] = '[FILTERED]';
                }
            }
            
            Log::info('API Request Body', [
                'body' => $body
            ]);
        }
        
        // Process the request
        $response = $next($request);
        
        $endTime = microtime(true);
        $responseTime = round(($endTime - $startTime) * 1000, 2); // in milliseconds
        
        // Log response
        Log::info('API Request Completed', [
            'status_code' => $response->getStatusCode(),
            'response_time_ms' => $responseTime,
            'memory_usage_mb' => round(memory_get_usage() / 1024 / 1024, 2),
            'memory_peak_mb' => round(memory_get_peak_usage() / 1024 / 1024, 2),
            'response_size' => strlen($response->getContent()),
            'timestamp' => now()->toISOString()
        ]);
        
        // Log slow requests (> 1 second)
        if ($responseTime > 1000) {
            Log::warning('Slow API Request', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'response_time_ms' => $responseTime,
                'user_id' => auth()->id(),
                'status_code' => $response->getStatusCode()
            ]);
        }
        
        // Log errors (4xx and 5xx status codes)
        if ($response->getStatusCode() >= 400) {
            $level = $response->getStatusCode() >= 500 ? 'error' : 'warning';
            Log::log($level, 'API Request Error Response', [
                'status_code' => $response->getStatusCode(),
                'response_body' => $response->getContent(),
                'user_id' => auth()->id()
            ]);
        }
        
        // Add response headers for debugging
        $response->headers->set('X-Request-ID', $requestId);
        $response->headers->set('X-Response-Time', $responseTime . 'ms');
        
        return $response;
    }
    
    /**
     * Get filtered headers (excluding sensitive information)
     *
     * @param Request $request
     * @return array
     */
    private function getFilteredHeaders(Request $request): array
    {
        $headers = $request->headers->all();
        
        // Filter out sensitive headers
        $sensitiveHeaders = ['authorization', 'cookie', 'x-csrf-token'];
        
        foreach ($sensitiveHeaders as $header) {
            if (isset($headers[$header])) {
                $headers[$header] = ['[FILTERED]'];
            }
        }
        
        return $headers;
    }
} 