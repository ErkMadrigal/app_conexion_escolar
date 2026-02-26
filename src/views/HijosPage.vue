<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Mis hijos</ion-title>

        <!-- Botón en header -->
        <ion-buttons slot="end">
          <ion-button @click="openAddModal">
            Agregar hijo
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <ion-card v-if="selected">
        <ion-card-header>
          <ion-card-title>Seleccionado</ion-card-title>
          <ion-card-subtitle>{{ selected.nombreCompleto }}</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-button expand="block" router-link="/tabs/historial">
            Ver historial
          </ion-button>
        </ion-card-content>
      </ion-card>

      <ion-list>
        <ion-item v-for="h in hijos" :key="h.id" button @click="pick(h)">
          <ion-label>
            <h2>{{ h.nombreCompleto }}</h2>
          </ion-label>

          <ion-badge v-if="selected?.id === h.id" color="success">Activo</ion-badge>
        </ion-item>
      </ion-list>

      <ion-item v-if="!loading && !hijos.length">
        <ion-label>No tienes hijos vinculados.</ion-label>
      </ion-item>

      <ion-loading :is-open="loading" message="Cargando..." />
      <ion-loading :is-open="saving" message="Guardando..." />

      <!-- ✅ MODAL: agregar por CURP -->
      <ion-modal :is-open="addOpen" @didDismiss="addOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Agregar hijo por CURP</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="addOpen = false">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="stacked">CURP</ion-label>
            <ion-input
              v-model="curp"
              placeholder="Curp a 18 caracteres"
              autocapitalize="characters"
              :maxlength="18"
            />
          </ion-item>

          <ion-text color="danger" v-if="errorText">
            <p style="margin-top: 10px">{{ errorText }}</p>
          </ion-text>

          <ion-button expand="block" style="margin-top: 16px" @click="saveCurp">
            Asignar
          </ion-button>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonBadge, IonLoading,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonRefresher, IonRefresherContent,
  IonButtons, IonModal, IonInput, IonText
} from "@ionic/vue";
import { onMounted, ref } from "vue";
import { apiPost } from "@/api"; // <-- usa tu helper real
import { getSelectedHijo, setSelectedHijo } from "@/lib/state";

/**
 * Tu EP regresa:
 * { status:"ok", estudiante:[{id:"611", nombreCompleto:"..."}, ...] }
 */
type HijoEP = {
  id: string | number;
  nombreCompleto: string;
};

const hijos = ref<HijoEP[]>([]);
const loading = ref(false);
const saving = ref(false);
const selected = ref<HijoEP | null>(getSelectedHijo() as any ?? null);

const addOpen = ref(false);
const curp = ref("");
const errorText = ref("");

function getDeviceId(): string {
  // ✅ Ajusta a donde tú guardas tu device_id
  // Ejemplos:
  // return localStorage.getItem("device_id") ?? "";
  // o si lo guardas como "DEVICE_ID"
  return localStorage.getItem("device_id") ?? "112ebd385b4b1d12";
}

async function load() {
  loading.value = true;
  try {
    const device_id = getDeviceId();
    if (!device_id) {
      hijos.value = [];
      selected.value = null;
      return;
    }

    const data = await apiPost("/estudiantes/getEstuden", { device_id });

    const arr = Array.isArray(data?.estudiante) ? data.estudiante : [];
    hijos.value = arr;

    // Si no hay seleccionado o ya no existe, elige el primero
    const stillExists = selected.value && hijos.value.some(h => String(h.id) === String(selected.value!.id));
    if ((!selected.value || !stillExists) && hijos.value.length) {
      selected.value = hijos.value[0];
      setSelectedHijo(hijos.value[0] as any);
    }

    if (!hijos.value.length) {
      selected.value = null;
      setSelectedHijo(null as any);
    }
  } finally {
    loading.value = false;
  }
}

function pick(h: HijoEP) {
  selected.value = h;
  setSelectedHijo(h as any);
}

async function onRefresh(ev: CustomEvent) {
  await load();
  (ev.target as any).complete();
}

function openAddModal() {
  errorText.value = "";
  curp.value = "";
  addOpen.value = true;
}

async function saveCurp() {
  errorText.value = "";

  const device_id = getDeviceId();
  const c = curp.value.trim().toUpperCase();

  if (!device_id) {
    errorText.value = "No tengo device_id del dispositivo.";
    return;
  }
  if (!c || c.length < 10) {
    errorText.value = "CURP inválida.";
    return;
  }

  saving.value = true;
  try {
    const resp = await apiPost("/devices/addStudentByCurp", {
      device_id,
      curp: c
    });

    if (resp?.status !== "ok") {
      errorText.value = resp?.message ?? "No se pudo asignar el estudiante.";
      return;
    }

    addOpen.value = false;

    // ✅ recarga lista para que aparezca el nuevo
    await load();

    // ✅ si el endpoint te regresara el student id, aquí podrías auto-seleccionarlo
    // por ahora: si no hay seleccionado, selecciona primero
    if (!selected.value && hijos.value.length) {
      selected.value = hijos.value[0];
      setSelectedHijo(hijos.value[0] as any);
    }
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>