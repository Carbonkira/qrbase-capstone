<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// =========================================================================
// THE NUCLEAR FAIL-SAFE
// Injecting the Cloudinary URL globally before Laravel even boots up.
// This guarantees the ServiceProvider will find the key and never crash.
// =========================================================================
$cloudinaryUrl = 'cloudinary://785553928652788:CBMFldO9HDKUF3H3ZiMeG9i5sDY@dyxszia6d';
putenv("CLOUDINARY_URL={$cloudinaryUrl}");
$_ENV['CLOUDINARY_URL'] = $cloudinaryUrl;
$_SERVER['CLOUDINARY_URL'] = $cloudinaryUrl;

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());