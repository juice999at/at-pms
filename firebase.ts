
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

/**
 * 注意：Firebase 数据库位置在创建后无法更改。
 * 如果你需要将位置从美国迁移到亚洲：
 * 1. 前往 Firebase 控制台 (console.firebase.google.com) 创建一个新项目。
 * 2. 在创建 Firestore 数据库时，选择 "Cloud Firestore Location" 为亚洲区域（如 asia-east1）。
 * 3. 获取新项目的 SDK 配置并替换下方的 firebaseConfig。
 */
const firebaseConfig = {
  // 请在此处替换为您在亚洲区域新建项目的配置信息
  apiKey: "AIzaSyBgkVBm7N_fdGfeq7aJmYbhV8BTpMkUKEA",
  authDomain: "ark-pms.firebaseapp.com",
  projectId: "ark-pms",
  storageBucket: "ark-pms.firebasestorage.app",
  messagingSenderId: "1019068323783",
  appId: "1:1019068323783:web:d93c85767294a25db62be2",
  measurementId: "G-KP4LLBRFRJ"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Firestore 数据库
const db = getFirestore(app);

/**
 * 启用离线持久化 (Offline Persistence)
 * 无论数据库在哪个区域，开启此功能都能显著提升访问速度，
 * 因为它会优先读取本地缓存，并在后台异步同步数据。
 */
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("离线持久化失败：可能在多个标签页中打开了应用。");
    } else if (err.code === 'unimplemented') {
      console.warn("当前浏览器不支持离线持久化。");
    }
  });
}

export { db };
