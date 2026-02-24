<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Cambiar contraseña</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Primera vez</ion-card-title>
          <ion-card-subtitle>Actualiza tu contraseña</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <ion-item>
            <ion-input label="CURP" label-placement="stacked" v-model="curp" />
          </ion-item>

          <ion-item class="ion-margin-top">
            <ion-input label="Password actual" label-placement="stacked" v-model="current" type="password"/>
          </ion-item>

          <ion-item class="ion-margin-top">
            <ion-input label="Nuevo password" label-placement="stacked" v-model="next" type="password"/>
          </ion-item>

          <ion-text color="danger" v-if="error" class="ion-margin-top">
            <p>{{ error }}</p>
          </ion-text>

          <ion-button expand="block" class="ion-margin-top" :disabled="loading" @click="change">
            {{ loading ? "Guardando..." : "Guardar" }}
          </ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonItem, IonInput, IonButton, IonText
} from "@ionic/vue";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { apiPost } from "@/api";
import { getStudent } from "@/services/session";
import { initPushAndRegister } from "@/services/push";

const router = useRouter();
const curp = ref("");
const current = ref("");
const next = ref("");
const loading = ref(false);
const error = ref("");

onMounted(() => {
  const st = getStudent();
  if (st?.curp) curp.value = st.curp;
});

async function change() {
  error.value = "";
  loading.value = true;
  try {
    await apiPost("/auth/change-password", {
      curp: curp.value.trim(),
      current_password: current.value,
      new_password: next.value,
    });

    await initPushAndRegister();
    router.replace("/tabs/hijos");
  } catch (e: any) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}
</script>