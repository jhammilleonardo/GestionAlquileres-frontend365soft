// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/', '.angular/', 'node_modules/', 'coverage/'],
  },
  // ── TypeScript ───────────────────────────────────────────────────────────
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    // Procesa los templates inline (`template: \`...\``) para que las reglas
    // a11y de plantilla también apliquen ahí, no sólo en los .html externos.
    processor: angular.processInlineTemplates,
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Angular usa Validators.required, Validators.email, etc. como referencias
      // a métodos estáticos — falso positivo conocido en Angular + TS ESLint
      '@typescript-eslint/unbound-method': ['error', { ignoreStatic: true }],
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
    },
  },
  // ── Plantillas Angular — accesibilidad (a11y), requisito ADA ──────────────
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateAccessibility],
    rules: {
      // Reglas con backlog de violaciones preexistentes: quedan en `warn` para
      // ser visibles y arreglarse de forma incremental sin bloquear CI. Las
      // demás reglas a11y (alt-text, role-has-required-aria, etc.) siguen como
      // `error` (enforced). Objetivo: ir bajando estas a `error`.
      '@angular-eslint/template/label-has-associated-control': 'warn',
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',
    },
  },
);
