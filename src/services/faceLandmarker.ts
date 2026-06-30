/**
 * Serviço responsável por criar e gerenciar o detector de pontos faciais do
 * MediaPipe (Face Landmarker, da biblioteca @mediapipe/tasks-vision).
 *
 * Por que MediaPipe?
 *  - Roda 100% local no navegador (a inferência acontece no dispositivo).
 *  - Fornece os pontos da íris e dos cantos dos olhos, suficientes para
 *    distinguir esquerda/centro/direita com boa precisão.
 *  - É gratuito, mantido pelo Google e leve o bastante para tablets.
 *
 * Observação sobre rede: o MODELO (.task) e o runtime WASM são baixados de um
 * CDN gratuito na primeira execução e ficam em cache no navegador. Nenhuma
 * imagem da câmera sai do dispositivo. Para uso 100% offline, veja o README
 * (seção "Uso offline"): basta hospedar esses arquivos localmente.
 */

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const WASM_PATH =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';

const MODEL_PATH =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

let instance: FaceLandmarker | null = null;
let creating: Promise<FaceLandmarker> | null = null;

/**
 * Cria (ou reaproveita) uma instância do FaceLandmarker em modo VIDEO.
 * Usamos um singleton para não recriar o modelo a cada montagem de componente.
 */
export async function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (instance) return instance;
  // Evita corrida quando dois lugares pedem o detector ao mesmo tempo.
  if (creating) return creating;

  creating = (async () => {
    const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
    const landmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: MODEL_PATH,
        // 'GPU' acelera bastante; se indisponível, o MediaPipe cai para CPU.
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      // Blendshapes nos dão um indicador pronto de "olho fechado", usado para
      // detectar piscadas de forma confiável.
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: false,
    });
    instance = landmarker;
    return landmarker;
  })();

  return creating;
}

/** Libera o detector (útil em testes ou ao desmontar a aplicação). */
export function disposeFaceLandmarker(): void {
  instance?.close();
  instance = null;
  creating = null;
}
