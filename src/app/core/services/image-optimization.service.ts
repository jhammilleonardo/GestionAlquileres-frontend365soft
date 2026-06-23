import { Injectable } from '@angular/core';

export interface ImageOptimizationOptions {
  readonly maxWidth?: number;
  readonly maxHeight?: number;
  readonly quality?: number;
}

const DEFAULT_OPTIONS: Required<ImageOptimizationOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.82,
};

@Injectable({ providedIn: 'root' })
export class ImageOptimizationService {
  async optimizeFile(file: File, options: ImageOptimizationOptions = {}): Promise<File> {
    if (!file.type.startsWith('image/')) return file;

    const merged = { ...DEFAULT_OPTIONS, ...options };

    try {
      const bitmap = await createImageBitmap(file);
      const { width, height } = this.constrainSize(bitmap.width, bitmap.height, merged);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return file;

      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      const blob = await this.canvasToBlob(canvas, merged.quality);
      if (!blob) return file;

      return new File([blob], this.toWebpName(file.name), {
        type: 'image/webp',
        lastModified: Date.now(),
      });
    } catch {
      return file;
    }
  }

  async optimizeFiles(files: readonly File[], options?: ImageOptimizationOptions): Promise<File[]> {
    return Promise.all(files.map((file) => this.optimizeFile(file, options)));
  }

  async filesToFormData(
    files: readonly File[],
    fieldName: string,
    options?: ImageOptimizationOptions,
  ): Promise<FormData> {
    const formData = new FormData();
    const optimized = await this.optimizeFiles(files, options);
    optimized.forEach((file) => formData.append(fieldName, file, file.name));
    return formData;
  }

  async appendOptimizedFile(
    formData: FormData,
    fieldName: string,
    file: File,
    options?: ImageOptimizationOptions,
  ): Promise<void> {
    const optimized = await this.optimizeFile(file, options);
    formData.append(fieldName, optimized, optimized.name);
  }

  private constrainSize(
    width: number,
    height: number,
    options: Required<ImageOptimizationOptions>,
  ): { width: number; height: number } {
    const ratio = Math.min(1, options.maxWidth / width, options.maxHeight / height);
    return {
      width: Math.max(1, Math.round(width * ratio)),
      height: Math.max(1, Math.round(height * ratio)),
    };
  }

  private canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  }

  private toWebpName(name: string): string {
    const base = name.replace(/\.[^.]+$/, '');
    return `${base || 'image'}.webp`;
  }
}
