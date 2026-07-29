import { forwardRef } from 'react';
import type { ElementRef, ComponentPropsWithoutRef } from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';
import styles from './Avatar.module.css';

export const Avatar = forwardRef<
  ElementRef<typeof AvatarPrimitive.Root>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root ref={ref} className={cn(styles.avatar, className)} {...props} />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

/**
 * `alt=""` POR DEFECTO, deliberadamente.
 *
 * En esta aplicación el avatar aparece SIEMPRE junto al nombre de la persona en
 * texto: la fila del directorio, la tarjeta de cumpleaños, la tabla de
 * plantilla, la cabecera de perfil, el menú del Topbar. En todos esos sitios la
 * imagen es decorativa — no aporta nada que el texto de al lado no diga ya.
 *
 * Con el nombre en el `alt`, un lector de pantalla lo anuncia DOS VECES
 * seguidas ("Mauricio Donado, Administrador, Mauricio Donado"). Pasó en el
 * Topbar y, cuando se corrigió ahí, resultó que el mismo error estaba en 7 call
 * sites más: cada uno decidía su `alt` por su cuenta y casi todos eligieron mal.
 * De ahí el default aquí — que el caso correcto sea el que no hay que recordar.
 *
 * Si algún día el avatar es la ÚNICA identificación de la persona (sin nombre
 * al lado), pasa un `alt` descriptivo explícito: el default no lo impide.
 */
export const AvatarImage = forwardRef<
  ElementRef<typeof AvatarPrimitive.Image>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, alt = '', ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn(styles.image, className)} alt={alt} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

export const AvatarFallback = forwardRef<
  ElementRef<typeof AvatarPrimitive.Fallback>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback ref={ref} className={cn(styles.fallback, className)} {...props} />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;
