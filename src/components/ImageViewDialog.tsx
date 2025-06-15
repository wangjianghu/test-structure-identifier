
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageViewDialogProps {
  imageUrl: string;
  fileName: string;
  children: React.ReactNode;
}

export function ImageViewDialog({ imageUrl, fileName, children }: ImageViewDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="relative">
          <img 
            src={imageUrl} 
            alt={fileName}
            className="w-full h-auto max-h-[80vh] object-contain"
          />
          <div className="p-4 border-t bg-background">
            <p className="text-sm text-muted-foreground text-center">{fileName}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
