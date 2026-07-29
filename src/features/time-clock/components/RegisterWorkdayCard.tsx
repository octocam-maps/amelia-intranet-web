import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { BatchTimeClockEntryForm } from './BatchTimeClockEntryForm';
import { TimeClockEntryForm } from './TimeClockEntryForm';
import styles from './RegisterWorkdayCard.module.css';

/**
 * Unifica en una sola tarjeta las dos formas de registrar jornada a mano, que
 * antes eran dos tarjetas seguidas ("Añadir o corregir un tramo manualmente" y
 * "Fichar un rango de días"). Pedían los mismos campos y abrían las dos con la
 * fecha de hoy, así que se leían como lo mismo repetido.
 *
 * Siguen siendo dos flujos porque NO hacen lo mismo, y la diferencia importa:
 *
 * - **Un día** (`POST /time-clock/entries`) registra el tramo que se le pida,
 *   incluidos sábados, festivos o días con ausencia aprobada. Es el caso de
 *   "trabajé de guardia este sábado, apúntalo".
 * - **Varios días** (`POST /time-clock/entries/batch`) aplica el mismo horario
 *   a un rango y EXCLUYE automáticamente lo que no toca (fin de semana,
 *   festivo, ausencia aprobada, día ya fichado). Es el caso de "olvidé fichar
 *   toda la semana".
 *
 * Por eso cada pestaña lleva un texto que dice qué hace: sin él, elegir una u
 * otra es adivinar.
 */
export function RegisterWorkdayCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar jornada</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="single">
          <TabsList>
            <TabsTrigger value="single">Un día</TabsTrigger>
            <TabsTrigger value="range">Varios días</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <p className={styles.hint}>
              Registra o corrige un día concreto. Se guarda tal cual lo indiques, incluso si es fin
              de semana o festivo.
            </p>
            <TimeClockEntryForm />
          </TabsContent>

          <TabsContent value="range">
            <p className={styles.hint}>
              Aplica el mismo horario a varios días seguidos, por ejemplo si olvidaste fichar toda
              la semana.
            </p>
            <BatchTimeClockEntryForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
