<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Asistencias Estudiante</ion-title>

        <!-- opcional: botón para regresar a hijos -->
        <ion-buttons slot="end">
          <ion-button router-link="/tabs/hijos">Hijos</ion-button>
        </ion-buttons>
      </ion-toolbar>

      <ion-toolbar>
        <ion-segment v-model="tipe">
          <ion-segment-button value="daily">
            <ion-label>Diario</ion-label>
          </ion-segment-button>
          <ion-segment-button value="weekly">
            <ion-label>Semana</ion-label>
          </ion-segment-button>
          <ion-segment-button value="monthly">
            <ion-label>Mes</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <!-- ✅ Estudiante seleccionado (viene de HijosPage) -->
      <ion-card v-if="selected">
        <ion-card-header>
          <ion-card-title>{{ selected.nombreCompleto }}</ion-card-title>
          <ion-card-subtitle>Consulta por tipo: {{ tipe }}</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <ion-button expand="block" :disabled="loading" @click="loadAssists(true)">
            {{ loading ? "Cargando..." : "Actualizar" }}
          </ion-button>

          <ion-text color="danger" v-if="errorMsg">
            <p class="ion-margin-top">{{ errorMsg }}</p>
          </ion-text>
        </ion-card-content>
      </ion-card>

      <!-- ✅ Si no hay hijo seleccionado -->
      <ion-card v-else>
        <ion-card-header>
          <ion-card-title>Sin estudiante seleccionado</ion-card-title>
          <ion-card-subtitle>
            Regresa a <b>Mis hijos</b> y selecciona uno.
          </ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <ion-button expand="block" router-link="/tabs/hijos">
            Ir a Mis hijos
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Resultados -->
      <ion-card v-if="selected && !loading">
        <ion-card-header>
          <ion-card-title>Resultados</ion-card-title>
          <ion-card-subtitle>Registros: {{ count }}</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <ion-list v-if="assists.length">
            <ion-item v-for="(row, i) in assists" :key="i">
              <ion-label>
                <h2>{{ pickDate(row) }}</h2>
                <p>{{ pickType(row) }}</p>
                <p>{{ pickName(row) }}</p>
              </ion-label>
            </ion-item>
          </ion-list>

          <div v-else>
            <p>No hay asistencias para mostrar.</p>
          </div>
        </ion-card-content>
      </ion-card>

      
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { onIonViewWillEnter } from "@ionic/vue";
import { API_URL } from "@/config/api";
import { getSelectedHijo } from "@/lib/state";

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonButton,
  IonButtons,
  IonText,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonAccordionGroup,
  IonAccordion,
} from "@ionic/vue";

type Tipe = "daily" | "weekly" | "monthly";

type Hijo = {
  id: string | number;
  nombreCompleto: string;
};

const tipe = ref<Tipe>("daily");
const selected = ref<Hijo | null>((getSelectedHijo() as any) ?? null);

const loading = ref(false);
const errorMsg = ref("");

const assists = ref<any[]>([]);
const count = ref(0);

const lastRaw = ref("");

function pickDate(row: any) {
  return row?.ingreso ?? "Sin fecha";
}
function pickType(row: any) {
  return row?.tipo ?? "";
}
function pickName(row: any) {
  return row?.nombreCompleto ?? "";
}

async function loadAssists(showErrors = true) {
  errorMsg.value = "";
  assists.value = [];
  count.value = 0;
  lastRaw.value = "";

  // ✅ Re-lee por si cambió en HijosPage
  selected.value = (getSelectedHijo() as any) ?? null;

  const id = selected.value?.id ? Number(selected.value.id) : 0;
  if (id <= 0) {
    if (showErrors) errorMsg.value = "Primero selecciona un estudiante en Mis hijos.";
    return;
  }

  loading.value = true;

  try {
    const url = `${API_URL}/estudiantes/getAssistsEstudent`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipe: tipe.value,
        id_estudent: id,
      }),
    });

    const text = await resp.text();
    lastRaw.value = text;

    let json: any = null;
    try { json = JSON.parse(text); } catch {}

    if (!resp.ok) throw new Error(json?.message || `HTTP ${resp.status}`);
    if (!json || json.status !== "ok") throw new Error(json?.message || "Respuesta inválida del servidor");

    assists.value = Array.isArray(json.data) ? json.data : [];
    count.value = typeof json.count === "number" ? json.count : assists.value.length;
  } catch (e: any) {
    if (showErrors) errorMsg.value = e?.message || "Error al consultar";
  } finally {
    loading.value = false;
  }
}

async function onRefresh(ev: CustomEvent) {
  await loadAssists(false);
  (ev.target as any).complete();
}

// ✅ Cada que entras a la pantalla, carga según el hijo seleccionado
onIonViewWillEnter(() => {
  loadAssists(false);
});

// ✅ Si cambias el segment, recarga
watch(tipe, () => {
  loadAssists(false);
});
</script>