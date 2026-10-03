import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Download, 
  Sparkles, 
  User, 
  Accessibility, 
  Check, 
  Loader2, 
  RefreshCw,
  Info,
  Upload,
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Configuration des personnages
const CHARACTERS = [
  {
    id: "maya",
    name: "Maya",
    description: "Jeune femme athlétique, dynamique et moderne.",
    prompt: "A young athletic woman in her 20s with a focused expression, wearing high-quality sage green yoga leggings and a matching sports bra. She has her hair in a neat bun.",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "david",
    name: "David",
    description: "Homme d'âge mûr, calme, souple et serein.",
    prompt: "A fit middle-aged man in his 40s with a calm and serene face, wearing comfortable grey linen yoga pants and a simple white tank top. He has short salt-and-pepper hair.",
    image: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "elena",
    name: "Elena",
    description: "Femme senior, sage, gracieuse et expérimentée.",
    prompt: "A graceful senior woman in her 60s with a peaceful smile, wearing traditional loose-fitting white yoga attire. She has long silver hair tied back elegantly.",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400"
  }
];

// Configuration des poses
const POSES = [
  {
    id: "downward-dog",
    name: "Chien tête en bas",
    sanskrit: "Adho Mukha Svanasana",
    description: "Une pose d'inversion qui étire tout le corps.",
    prompt: "performing the Downward-Facing Dog yoga pose (Adho Mukha Svanasana) on a high-quality cork yoga mat. The body forms an inverted V-shape with hands and feet on the floor."
  },
  {
    id: "tree-pose",
    name: "L'arbre",
    sanskrit: "Vrikshasana",
    description: "Améliore l'équilibre et la concentration.",
    prompt: "performing the Tree yoga pose (Vrikshasana) on a high-quality cork yoga mat. Standing on one leg with the other foot pressed against the inner thigh, hands in prayer position at the heart."
  },
  {
    id: "warrior-2",
    name: "Guerrier II",
    sanskrit: "Virabhadrasana II",
    description: "Renforce les jambes et ouvre les hanches.",
    prompt: "performing the Warrior II yoga pose (Virabhadrasana II) on a high-quality cork yoga mat. Strong wide stance, arms extended horizontally, gaze over the front hand."
  },
  {
    id: "lotus",
    name: "Lotus",
    sanskrit: "Padmasana",
    description: "Pose de méditation classique pour la paix intérieure.",
    prompt: "sitting in the full Lotus yoga pose (Padmasana) on a high-quality cork yoga mat. Legs crossed with feet resting on opposite thighs, hands resting on knees with fingers in a mudra, eyes closed in meditation."
  },
  {
    id: "cobra",
    name: "Cobra",
    sanskrit: "Bhujangasana",
    description: "Ouvre le cœur et renforce le dos.",
    prompt: "performing the Cobra yoga pose (Bhujangasana) on a high-quality cork yoga mat. Lying on the stomach, chest lifted off the ground using back muscles, arms slightly bent, looking forward."
  }
];

const POSE_STUDIO_IMAGES: Record<string, string> = {
  "downward-dog": "/src/assets/images/pose_downward_dog_1791004202592.jpg",
  "tree-pose": "/src/assets/images/pose_tree_1791004214978.jpg",
  "warrior-2": "/src/assets/images/pose_warrior_1791004224966.jpg",
  "lotus": "/src/assets/images/pose_lotus_1791004235720.jpg",
  "cobra": "/src/assets/images/pose_cobra_1791004246342.jpg",
};

export default function App() {
  const [selectedChar, setSelectedChar] = useState<typeof CHARACTERS[0] | { id: string, name: string, description: string, prompt: string, image: string } | null>(null);
  const [selectedPose, setSelectedPose] = useState<typeof POSES[0] | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customImage, setCustomImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [isStudioMode, setIsStudioMode] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image valide.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const data = base64.split(',')[1];
      setCustomImage({ data, mimeType: file.type });
      setSelectedChar({
        id: "custom",
        name: "Moi",
        description: "Votre propre photo pour une séance personnalisée.",
        prompt: "The person from the provided image",
        image: base64
      });
      toast.success("Photo ajoutée !");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!selectedChar || !selectedPose) {
      toast.error("Veuillez sélectionner un personnage et une pose.");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const textPrompt = selectedChar.id === "custom" 
        ? `Generate an image of the person from the provided photo ${selectedPose.prompt}. Maintain their facial features, body type, and clothing style. The setting is a bright, minimalist yoga studio with soft natural light, wooden floors, and a peaceful atmosphere. High quality, realistic, professional photography style.`
        : `${selectedChar.prompt} is ${selectedPose.prompt} The setting is a bright, minimalist yoga studio with soft natural light coming from large windows, wooden floors, and a peaceful atmosphere. High quality, realistic, professional photography style.`;

      const response = await fetch("/api/generate-pose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: textPrompt,
          customImage: selectedChar.id === "custom" && customImage ? customImage : null,
          poseId: selectedPose.id,
          charId: selectedChar.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de la génération de l'image.");
      }

      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setIsStudioMode(false);
        toast.success("Image générée avec succès !");
      } else if (data.fallbackUsed) {
        const fallbackImg = POSE_STUDIO_IMAGES[selectedPose.id] || POSE_STUDIO_IMAGES["lotus"];
        setGeneratedImage(fallbackImg);
        setIsStudioMode(true);
        toast.info(data.message || "Visuel studio officiel activé.");
      } else {
        throw new Error("Aucune image n'a été reçue.");
      }
    } catch (error: any) {
      console.error("Erreur de génération:", error);
      toast.error(error.message || "Une erreur est survenue lors de la génération de l'image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      if (generatedImage.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = generatedImage;
        link.download = `zenpose-${selectedChar?.id}-${selectedPose?.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const res = await fetch(generatedImage);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `zenpose-${selectedChar?.id}-${selectedPose?.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }
      toast.success("Image téléchargée !");
    } catch {
      window.open(generatedImage, "_blank");
    }
  };

  const reset = () => {
    setSelectedChar(null);
    setSelectedPose(null);
    setGeneratedImage(null);
    setCustomImage(null);
    setIsStudioMode(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Toaster position="top-center" />
      
      <header className="h-20 bg-white flex items-center justify-between px-10 border-b-4 border-accent shadow-sm">
        <div className="text-3xl font-black text-primary tracking-widest uppercase">YOGIGEN</div>
        <div className="hidden md:flex gap-8">
          <div className={`flex items-center gap-2 font-bold transition-opacity ${selectedChar ? "opacity-100 text-secondary" : "opacity-40"}`}>
            <span className="w-6 h-6 bg-foreground text-background rounded-full flex items-center justify-center text-xs">1</span>
            Personnage
          </div>
          <div className={`flex items-center gap-2 font-bold transition-opacity ${selectedPose ? "opacity-100 text-secondary" : "opacity-40"}`}>
            <span className="w-6 h-6 bg-foreground text-background rounded-full flex items-center justify-center text-xs">2</span>
            Posture
          </div>
          <div className={`flex items-center gap-2 font-bold transition-opacity ${generatedImage ? "opacity-100 text-secondary" : "opacity-40"}`}>
            <span className="w-6 h-6 bg-foreground text-background rounded-full flex items-center justify-center text-xs">3</span>
            Export
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-6 p-6 overflow-auto">
        {/* Section 1: Choose Person */}
        <div className="panel-shadow bg-white rounded-[24px] p-6 flex flex-col gap-4">
          <h2 className="text-sm font-extrabold text-primary uppercase tracking-wider mb-2">1. Choisir le modèle</h2>
          <div className="flex flex-col gap-4">
            {/* Custom Upload Option */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`border-3 rounded-2xl p-3 flex items-center gap-4 cursor-pointer transition-all relative overflow-hidden ${
                selectedChar?.id === "custom" 
                  ? "border-secondary bg-secondary/10" 
                  : "border-muted border-dashed hover:border-secondary/50"
              }`}
              onClick={() => {
                if (selectedChar?.id === "custom") {
                  setSelectedChar(selectedChar);
                } else {
                  document.getElementById('photo-upload')?.click();
                }
              }}
            >
              <input 
                type="file" 
                id="photo-upload" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload}
              />
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center overflow-hidden shrink-0 border-2 border-white shadow-sm relative">
                {selectedChar?.id === "custom" ? (
                  <img 
                    src={selectedChar.image} 
                    alt="Ma photo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-6 h-6 text-primary" />
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Upload className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <div className="font-bold text-sm">{selectedChar?.id === "custom" ? "Ma Photo" : "Utiliser ma photo"}</div>
                <div className="text-[10px] opacity-60 uppercase font-bold tracking-tight">
                  {selectedChar?.id === "custom" ? "Photo chargée" : "Cliquez pour uploader"}
                </div>
              </div>
              {selectedChar?.id === "custom" && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-auto h-8 w-8 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('photo-upload')?.click();
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </motion.div>

            <div className="h-px bg-muted my-1" />

            {CHARACTERS.map((char) => (
              <motion.div
                key={char.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedChar(char)}
                className={`border-3 rounded-2xl p-3 flex items-center gap-4 cursor-pointer transition-all ${
                  selectedChar?.id === char.id 
                    ? "border-secondary bg-secondary/10" 
                    : "border-muted hover:border-secondary/50"
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center overflow-hidden shrink-0 border-2 border-white shadow-sm">
                  <img 
                    src={char.image} 
                    alt={char.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="font-bold text-sm">{char.name}</div>
                  <div className="text-[10px] opacity-60 uppercase font-bold tracking-tight">{char.description.split(',')[0]}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-auto bg-accent p-4 rounded-xl text-xs leading-relaxed font-medium">
            <strong>Conseil :</strong> Choisissez le modèle qui correspond le mieux à votre morphologie pour un rendu plus réaliste.
          </div>
        </div>

        {/* Section 2: Choose Pose */}
        <div className="panel-shadow bg-white rounded-[24px] p-6 flex flex-col gap-4">
          <h2 className="text-sm font-extrabold text-primary uppercase tracking-wider mb-2">2. Sélectionner la posture</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {POSES.map((pose) => (
              <motion.div
                key={pose.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPose(pose)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all border-2 ${
                  selectedPose?.id === pose.id 
                    ? "bg-accent border-foreground border-solid" 
                    : "bg-background border-muted border-dashed hover:bg-accent/30"
                }`}
              >
                <Accessibility className={`w-8 h-8 mb-2 ${selectedPose?.id === pose.id ? "text-foreground" : "text-muted-foreground"}`} />
                <div className="text-[10px] font-black uppercase leading-tight">{pose.name}</div>
              </motion.div>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground italic">
            <Info className="w-4 h-4 text-secondary" />
            Cliquez sur une posture pour la sélectionner.
          </div>
        </div>

        {/* Section 3: Result & Save */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-extrabold text-primary uppercase tracking-wider">3. Rendu & Sauvegarde</h2>
          <div className="flex-1 canvas-gradient rounded-[20px] relative overflow-hidden flex items-center justify-center shadow-inner min-h-[300px]">
            <div className="absolute top-5 right-5 bg-white/20 px-3 py-1 rounded-full text-[10px] text-white font-bold tracking-widest">PREVIEW</div>
            
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 text-white text-center p-6"
                >
                  <Loader2 className="w-12 h-12 animate-spin opacity-50" />
                  <p className="font-bold uppercase tracking-widest text-xs">Génération IA en cours...</p>
                </motion.div>
              ) : generatedImage ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full p-4 flex flex-col items-center justify-center"
                >
                  <img 
                    src={generatedImage} 
                    alt="Yoga pose générée" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain rounded-xl shadow-2xl"
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-4 text-white/30"
                >
                  <Sparkles className="w-20 h-20" />
                  <p className="font-bold uppercase tracking-widest text-xs">En attente de création</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-3">
            {generatedImage && isStudioMode && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Rendu Studio Haute Définition activé (Palier gratuit API : quota image = 0).</span>
              </div>
            )}
            {!generatedImage ? (
              <Button 
                onClick={handleGenerate}
                disabled={!selectedChar || !selectedPose || isGenerating}
                className="btn-save-shadow bg-primary hover:bg-primary/90 text-white h-16 rounded-full font-black text-lg uppercase tracking-widest transition-transform active:translate-y-[2px]"
              >
                {isGenerating ? "Génération..." : "Générer la pose"}
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={reset}
                  variant="outline"
                  className="h-14 rounded-full font-bold uppercase tracking-wider border-2"
                >
                  Reset
                </Button>
                <Button 
                  onClick={handleDownload}
                  className="btn-save-shadow bg-secondary hover:bg-secondary/90 text-white h-14 rounded-full font-black uppercase tracking-widest transition-transform active:translate-y-[2px]"
                >
                  Sauvegarder
                </Button>
              </div>
            )}
            <div className="text-center text-[10px] font-bold opacity-30 uppercase tracking-widest">
              Format : PNG Haute Résolution (1024px)
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
