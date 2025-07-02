import { Dialog, DialogContent } from "@mui/material";

interface ImageViewerDialogProps {
  open: boolean;
  imageSrc: string | null;
  onClose: () => void;
}

export default function ImageViewerDialog({
  open,
  imageSrc,
  onClose,
}: ImageViewerDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        {imageSrc && (
          <img
            src={imageSrc}
            alt="Full size"
            style={{ width: "100%", height: "auto" }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
