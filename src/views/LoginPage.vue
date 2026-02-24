<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Conexión Escolar</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Login</ion-card-title>
          <ion-card-subtitle>CURP del alumno + contraseña</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <ion-item>
            <ion-input
              label="CURP"
              label-placement="stacked"
              v-model="curp"
              autocapitalize="characters"
              placeholder="MAFE990706HMCDLR05"
            />
          </ion-item>

          <ion-item class="ion-margin-top">
            <ion-input
              label="Password"
              label-placement="stacked"
              v-model="password"
              type="password"
              placeholder="MAFE9907"
            />
          </ion-item>

          <ion-text color="danger" v-if="error" class="ion-margin-top">
            <p>{{ error }}</p>
          </ion-text>

          <ion-button expand="block" class="ion-margin-top" :disabled="loading" @click="doLogin">
            {{ loading ? "Entrando..." : "Entrar" }}
          </ion-button>

          <ion-note class="ion-margin-top">
            Contraseña temporal: primeros 8 de la CURP (ej: MAFE9907)
          </ion-note>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonItem, IonInput, IonButton, IonText, IonNote
} from "@ionic/vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { loginMobile } from "@/api";
import { initPushAndRegister } from "@/services/push";

const router = useRouter();
const curp = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function doLogin() {
  error.value = "";
  loading.value = true;
  try {
    const res = await loginMobile(curp.value.trim(), password.value);

    // si debe cambiar password, lo mandas a la vista de cambio
    if (res.must_change_password === 1) {
      router.replace("/change-password");
      return;
    }

    // ✅ registrar push token (FCM) en BD
    await initPushAndRegister();

    // ✅ entrar a tabs
    router.replace("/tabs/hijos");
  } catch (e: any) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}
</script>