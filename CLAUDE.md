# Axcend CRM Platform

## Projeto
Este é o CRM da Axcend Sales — plataforma premium de gestão comercial.

## Stack
- Next.js 15 (App Router)
- TypeScript (strict mode)
- Tailwind CSS 4 com Design Tokens
- Framer Motion (animações)
- Supabase (banco, auth, storage, real-time)
- Prisma (ORM, migrations)
- Upstash Redis (cache, filas)
- Stripe (pagamentos, assinaturas)
- Vercel (deploy)

## Design System
- Paleta: Laranja #F97316 (primária), Preto, Branco
- Dark mode como padrão
- Fontes: Inter (sans) + JetBrains Mono (mono)
- Animações via lib/motion.ts (Framer Motion)

## Regras de Desenvolvimento
1. SEMPRE usar Context7 antes de implementar código com libs externas
2. NUNCA usar cores hex direto — sempre tokens semânticos
3. NUNCA usar any no TypeScript
4. Server Components por padrão — use client apenas quando necessário
5. Toda tabela precisa de RLS no Supabase
6. Schema.prisma é fonte de verdade para dados
7. Secrets no .env.local — nunca commitar
8. Naming em inglês para código, português para conteúdo do usuário
9. Animações com propósito funcional — nunca decorativas
10. Cada módulo deve ter qualidade de referência mundial

## Context7 Integration
Always use Context7 MCP tools before planning or implementing code that involves external libraries or frameworks:
1. Use resolve-library-id to get the correct library identifier
2. Use get-library-docs to fetch up-to-date documentation
3. Apply the documentation patterns in implementation
