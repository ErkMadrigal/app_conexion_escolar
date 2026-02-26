<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Asistencias Estudiante</ion-title>
      </ion-toolbar>

      <ion-toolbar>
        <ion-segment v-model="tipe" @ionChange="loadAssists(true)">
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

      <!-- ID Estudiante -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Parámetros</ion-card-title>
          <ion-card-subtitle>Consulta por tipo: {{ tipe }}</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <ion-item>
            <ion-label position="stacked">ID Estudiante</ion-label>
            <ion-input
              v-model="idEstudentInput"
              inputmode="numeric"
              placeholder="Ej: 12"
              @ionBlur="applyStudentId"
            />
          </ion-item>

          <ion-button
            expand="block"
            class="ion-margin-top"
            :disabled="loading"
            @click="loadAssists(true)"
          >
            {{ loading ? "Cargando..." : "Consultar" }}
          </ion-button>

          <ion-text color="danger" v-if="errorMsg">
            <p class="ion-margin-top">{{ errorMsg }}</p>
          </ion-text>
        </ion-card-content>
      </ion-card>

      <!-- Resultados -->
      <ion-card v-if="!loading">
        <ion-card-header>
          <ion-card-title>Resultados</ion-card-title>
          <ion-card-subtitle>
            Registros: {{ count }}
          </ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <ion-list v-if="assists.length">
            <ion-item v-for="(row, i) in assists" :key="i">
              <ion-label>
                <!-- Ajusta estos campos según tu backend -->
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

      <!-- Debug -->
      <ion-accordion-group class="ion-margin-top" v-if="lastRaw">
        <ion-accordion value="debug">
          <ion-item slot="header">
            <ion-label>Debug (response raw)</ion-label>
          </ion-item>
          <div
            slot="content"
            style="padding:12px; font-family: monospace; font-size: 12px; white-space: pre-wrap;"
          >
            {{ lastRaw }}
          </div>
        </ion-accordion>
      </ion-accordion-group>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { API_URL } from "@/config/api";

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
  IonInput,
  IonButton,
  IonText,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonAccordionGroup,
  IonAccordion,
} from "@ionic/vue";

type Tipe = "daily" | "weekly" | "monthly";

const tipe = ref<Tipe>("daily");

const idEstudent = ref<number>(0);
const idEstudentInput = ref<string>("");

const loading = ref(false);
const errorMsg = ref<string>("");

const assists = ref<any[]>([]);
const count = ref<number>(0);

const lastRaw = ref<string>("");

function applyStudentId() {
  const n = parseInt(idEstudentInput.value || "0", 10);
  idEstudent.value = Number.isFinite(n) ? n : 0;
}

function pickDate(row: any) {
  // Ajusta según tu respuesta real del modelo
  return row?.ingreso ?? "Sin fecha";
}

function pickType(row: any) {
  // Ajusta según tu respuesta real del modelo
  return row?.tipo ?? "";
}


function pickName(row: any) {
  // Ajusta según tu respuesta real del modelo
  return row?.nombreCompleto ?? "";
}

async function loadAssists(showErrors = true) {
  errorMsg.value = "";
  assists.value = [];
  count.value = 0;
  lastRaw.value = "";

  if (idEstudent.value <= 0) {
    if (showErrors) errorMsg.value = "Pon un id_estudent válido.";
    return;
  }

  loading.value = true;

  try {
    const url = `${API_URL}/estudiantes/getAssistsEstudent`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Bearer ${token}`, // si manejas JWT
      },
      body: JSON.stringify({
        tipe: tipe.value,
        id_estudent: idEstudent.value,
      }),
    });

    const text = await resp.text();
    lastRaw.value = text;

    let json: any = null;
    try { json = JSON.parse(text); } catch {}

    if (!resp.ok) {
      throw new Error(json?.message || `HTTP ${resp.status}`);
    }

    if (!json || json.status !== "ok") {
      throw new Error(json?.message || "Respuesta inválida del servidor");
    }

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
</script>