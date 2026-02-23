<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>

      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="hijos" href="/tabs/hijos">
          <ion-icon :icon="peopleOutline" />
          <ion-label>Hijos</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="historial" href="/tabs/historial">
          <ion-icon :icon="timeOutline" />
          <ion-label>Historial</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="perfil" href="/tabs/perfil">
          <ion-icon :icon="personCircleOutline" />
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton,
  IonIcon, IonLabel
} from "@ionic/vue";
import { peopleOutline, timeOutline, personCircleOutline } from "ionicons/icons";
</script>