<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidProfilePicture implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // If value is null or empty, it's valid (since profile picture is optional)
        if (is_null($value) || $value === '') {
            return;
        }

        // Check if it's a valid uploaded file
        if (!$value instanceof \Illuminate\Http\UploadedFile) {
            $fail('The :attribute must be a valid file.');
            return;
        }

        // Check if it's an image
        if (!$value->isValid()) {
            $fail('The :attribute upload failed.');
            return;
        }

        // Check file type (must be image)
        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($value->getMimeType(), $allowedMimes)) {
            $fail('The :attribute must be a valid image file (JPEG, PNG, GIF, or WebP).');
            return;
        }

        // Check file size (max 5MB)
        $maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if ($value->getSize() > $maxSize) {
            $fail('The :attribute must not be larger than 5MB.');
            return;
        }

        // Check image dimensions (optional - max 2000x2000)
        $imageInfo = getimagesize($value->getPathname());
        if ($imageInfo !== false) {
            [$width, $height] = $imageInfo;
            if ($width > 2000 || $height > 2000) {
                $fail('The :attribute dimensions must not exceed 2000x2000 pixels.');
                return;
            }
        }
    }
}
