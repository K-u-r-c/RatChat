import { TextField, InputAdornment } from "@mui/material";
import { Search } from "@mui/icons-material";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function DirectSearchInput({
  value,
  onChange,
  placeholder,
}: Props) {
  return (
    <TextField
      fullWidth
      size="small"
      placeholder={placeholder ?? "Search conversations"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
      sx={{
        bgcolor: "#1f2125",
        borderRadius: 1,
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "transparent",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "transparent",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "transparent",
        },
        input: { color: "white" },
      }}
    />
  );
}
