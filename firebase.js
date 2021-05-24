import { initializeApp, fireStore } from "firebase";
import "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA53wjAlMfPSuk6USFjddyuazcSOzjiziU",
  authDomain: "hyped-efb4a.firebaseapp.com",
  projectId: "hyped-efb4a",
  storageBucket: "hyped-efb4a.appspot.com",
  messagingSenderId: "499810676038",
  appId: "1:499810676038:web:d0ee78396cbfc340d94947"
};

initializeApp(firebaseConfig);
const db = fireStore();

export { db };