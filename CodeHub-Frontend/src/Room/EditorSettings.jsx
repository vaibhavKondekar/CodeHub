import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {
    AppBar, Toolbar, IconButton, Typography,
    FormControl, InputLabel, Select, MenuItem
} from "@mui/material";

const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'java', label: 'Java' },
    { value: 'python', label: 'Python' },
    { value: 'c_cpp', label: 'C/C++' },
    { value: 'golang', label: 'Go' },
    { value: 'csharp', label: 'C#' },
    { value: 'rust', label: 'Rust' }
];

const Settings = ({
    language,
    handleLangChange,
    run,
    running
}) => {

    return (
        <div className="editor-settings">
            <div className="settings-controls">
                <div className="control-group">
                    <Select
                        className="control-select"
                        value={language}
                        onChange={(e) => handleLangChange(e.target.value)}
                        displayEmpty
                        size="small"
                    >
                        {languageOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </div>
                
                <div className="control-group">
                    <IconButton
                        className="run-button"
                        disabled={running}
                        onClick={run}
                        size="large"
                    >
                        <PlayArrowIcon />
                    </IconButton>
                </div>
            </div>
        </div>
    )
}

export default Settings;