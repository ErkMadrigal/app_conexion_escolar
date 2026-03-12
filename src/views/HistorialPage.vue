<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Asistencias Estudiante</ion-title>

        <ion-buttons slot="end">
          <ion-button router-link="/tabs/hijos">Hijos</ion-button>
        </ion-buttons>
      </ion-toolbar>

      <ion-toolbar>
        <ion-segment v-model="tipe">
          <ion-segment-button value="weekly">
            <ion-label>Semanal</ion-label>
          </ion-segment-button>

          <ion-segment-button value="monthly">
            <ion-label>Mensual</ion-label>
          </ion-segment-button>

          <ion-segment-button value="all">
            <ion-label>Personalizado</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <!-- ✅ Estudiante seleccionado -->
      <ion-card v-if="selected">
        <ion-card-header>
          <ion-card-title>{{ selected.nombreCompleto }}</ion-card-title>
          <ion-card-subtitle>Consulta por tipo: {{ tipeLabel }}</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <!-- ✅ Fechas personalizadas -->
          <div v-if="tipe === 'all'" class="custom-range-wrap">
            <ion-item>
              <ion-label position="stacked">Fecha inicio</ion-label>
              <ion-input
                type="date"
                v-model="inicio"
                placeholder="YYYY-MM-DD"
              />
            </ion-item>

            <ion-item class="ion-margin-top">
              <ion-label position="stacked">Fecha fin</ion-label>
              <ion-input
                type="date"
                v-model="fin"
                placeholder="YYYY-MM-DD"
              />
            </ion-item>
          </div>

          <ion-button
            expand="block"
            class="ion-margin-top"
            :disabled="loading"
            @click="loadAssists(true)"
          >
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

      <!-- ✅ Resultados -->
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
import { ref, watch, computed } from "vue";
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
  IonInput,
} from "@ionic/vue";

type Tipe = "weekly" | "monthly" | "all";

type Hijo = {
  id: string | number;
  nombreCompleto: string;
};

const tipe = ref<Tipe>("weekly");
const selected = ref<Hijo | null>((getSelectedHijo() as any) ?? null);

const loading = ref(false);
const errorMsg = ref("");

const assists = ref<any[]>([]);
const count = ref(0);
const lastRaw = ref("");

// ✅ rango personalizado
const inicio = ref("");
const fin = ref("");

// ✅ etiqueta bonita
const tipeLabel = computed(() => {
  if (tipe.value === "weekly") return "Semanal";
  if (tipe.value === "monthly") return "Mensual";
  if (tipe.value === "all") return "Personalizado";
  return tipe.value;
});

function pickDate(row: any) {
  return row?.ingreso ?? "Sin fecha";
}

function pickType(row: any) {
  return row?.tipo ?? "";
}

function pickName(row: any) {
  return row?.nombreCompleto ?? "";
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function firstDayOfMonthStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

// ✅ valores iniciales útiles
if (!inicio.value) inicio.value = firstDayOfMonthStr();
if (!fin.value) fin.value = todayStr();

async function loadAssists(showErrors = true) {
  errorMsg.value = "";
  assists.value = [];
  count.value = 0;
  lastRaw.value = "";

  selected.value = (getSelectedHijo() as any) ?? null;

  const id = selected.value?.id ? Number(selected.value.id) : 0;
  if (id <= 0) {
    if (showErrors) {
      errorMsg.value = "Primero selecciona un estudiante en Mis hijos.";
    }
    return;
  }

  // ✅ valida rango si es personalizado
  if (tipe.value === "all") {
    if (!inicio.value || !fin.value) {
      if (showErrors) errorMsg.value = "Debes seleccionar fecha inicio y fecha fin.";
      return;
    }

    if (inicio.value > fin.value) {
      if (showErrors) errorMsg.value = "La fecha inicio no puede ser mayor a la fecha fin.";
      return;
    }
  }

  loading.value = true;

  try {
    const url = `${API_URL}/estudiantes/getAssistsEstudent`;

    const payload: any = {
      tipe: tipe.value,
      id_estudent: id,
    };

    if (tipe.value === "all") {
      payload.inicio = inicio.value;
      payload.fin = fin.value;
    }

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    lastRaw.value = text;

    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {}

    if (!resp.ok) {
      throw new Error(json?.message || `HTTP ${resp.status}`);
    }

    if (!json || json.status !== "ok") {
      throw new Error(json?.message || "Respuesta inválida del servidor");
    }

    assists.value = Array.isArray(json.data) ? json.data : [];
    count.value =
      typeof json.count === "number" ? json.count : assists.value.length;
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

onIonViewWillEnter(() => {
  loadAssists(false);
});

watch(tipe, () => {
  errorMsg.value = "";
  assists.value = [];
  count.value = 0;

  if (tipe.value !== "all") {
    loadAssists(false);
  }
});
</script>

<style scoped>
.custom-range-wrap {
  margin-top: 10px;
}
</style>