const { Plugin, Notice } = require('obsidian');

module.exports = class CopyWithImagesPlugin extends Plugin {
    async onload() {
        console.log('Loading Copy with Embedded Images plugin');
        
        // Security: Track last execution to prevent spam
        this.lastExecution = 0;
        this.MIN_INTERVAL = 500; // 500ms between executions
        
        // Security: Maximum file size (10MB)
        this.MAX_FILE_SIZE = 10 * 1024 * 1024;
        
        // Security: Allowed image extensions
        this.ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'];

        // Add command with hotkey
        this.addCommand({
            id: 'copy-markdown-with-embedded-images',
            name: 'Copy markdown with embedded images (base64)',
            callback: async () => {
                await this.copyMarkdownWithBase64Images();
            },
            hotkeys: [
                {
                    modifiers: ["Mod", "Shift"],
                    key: "c",
                }
            ]
        });
    }

    async copyMarkdownWithBase64Images() {
        try {
            // Security: Rate limiting to prevent spam/abuse
            const now = Date.now();
            if (now - this.lastExecution < this.MIN_INTERVAL) {
                new Notice('Please wait a moment before copying again');
                return;
            }
            this.lastExecution = now;
            
            const activeView = this.app.workspace.getActiveViewOfType(require('obsidian').MarkdownView);
            
            if (!activeView) {
                new Notice('No active markdown file');
                return;
            }

            const file = activeView.file;
            let content = await this.app.vault.read(file);
            
            // Convert images to base64
            const result = await this.convertImagesToBase64(content, file.path);
            
            if (result.skipped > 0) {
                new Notice(`Copied! (${result.skipped} image(s) skipped - too large or unsupported)`);
            } else {
                new Notice('Markdown with embedded images copied!');
            }
            
            // Copy to clipboard
            await navigator.clipboard.writeText(result.content);
            
        } catch (error) {
            console.error('Error copying with images:', error);
            // Security: Don't expose detailed error messages to user
            new Notice('Error copying markdown. Check console for details.');
        }
    }

    async convertImagesToBase64(content, notePath) {
        let skippedCount = 0;
        
        // Security: More restrictive regex patterns to prevent ReDoS
        // Only match reasonable filename lengths and patterns
        const wikiImageRegex = /!\[\[([^\]]{1,256}\.(png|jpg|jpeg|gif|webp|bmp))\]\]/gi;
        const mdImageRegex = /!\[([^\]]{0,256})\]\(([^\)]{1,512}\.(png|jpg|jpeg|gif|webp|bmp))\)/gi;
        
        // Process wiki-style images
        let match;
        const wikiMatches = [];
        while ((match = wikiImageRegex.exec(content)) !== null) {
            wikiMatches.push(match);
        }
        
        for (const match of wikiMatches) {
            const imageName = match[1];
            const result = await this.getImageAsBase64(imageName, notePath);
            
            if (result.success) {
                // Security: Escape special characters in alt text
                const altText = this.sanitizeAltText(imageName.split('/').pop().replace(/\.[^/.]+$/, ''));
                const replacement = `![${altText}](${result.base64})`;
                content = content.replace(match[0], replacement);
            } else {
                skippedCount++;
            }
        }
        
        // Process standard markdown images
        const mdMatches = [];
        const mdRegex = new RegExp(mdImageRegex.source, mdImageRegex.flags);
        while ((match = mdRegex.exec(content)) !== null) {
            mdMatches.push(match);
        }
        
        for (const match of mdMatches) {
            const altText = match[1];
            const imagePath = match[2];
            const result = await this.getImageAsBase64(imagePath, notePath);
            
            if (result.success) {
                // Security: Escape special characters in alt text
                const sanitizedAlt = this.sanitizeAltText(altText);
                const replacement = `![${sanitizedAlt}](${result.base64})`;
                content = content.replace(match[0], replacement);
            } else {
                skippedCount++;
            }
        }
        
        return { content, skipped: skippedCount };
    }
    
    sanitizeAltText(text) {
        // Security: Remove potentially dangerous characters from alt text
        return text.replace(/[<>\"']/g, '').substring(0, 200);
    }

    async getImageAsBase64(imagePath, notePath) {
        try {
            // Use Obsidian's file resolution to find the image
            const file = this.app.metadataCache.getFirstLinkpathDest(imagePath, notePath);
            
            if (!file) {
                console.warn(`Image not found: ${imagePath.substring(0, 50)}`);
                return { success: false };
            }
            
            // Security: Validate file extension
            const ext = file.extension.toLowerCase();
            if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
                console.warn(`Unsupported file type: ${ext}`);
                return { success: false };
            }
            
            // Security: Check file size before reading
            const stat = await this.app.vault.adapter.stat(file.path);
            if (stat && stat.size > this.MAX_FILE_SIZE) {
                console.warn(`File too large (${Math.round(stat.size / 1024 / 1024)}MB): ${file.name}`);
                return { success: false };
            }
            
            // Read the file as binary
            const arrayBuffer = await this.app.vault.readBinary(file);
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            
            const mimeType = this.getMimeType(ext);
            
            return { 
                success: true, 
                base64: `data:${mimeType};base64,${base64}` 
            };
        } catch (error) {
            // Security: Don't expose full paths in logs
            console.error(`Failed to process image: ${error.message}`);
            return { success: false };
        }
    }

    getMimeType(ext) {
        const mimeTypes = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'bmp': 'image/bmp'
        };
        return mimeTypes[ext] || 'image/png';
    }

    onunload() {
        console.log('Unloading Copy with Embedded Images plugin');
    }
}
