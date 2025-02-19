import { supabase } from '../../src/authentication/supabase-client.js';

const WORD_LISTS_TABLE = 'word_lists';

export class WordListManager {
    constructor() {
        this.setupListeners();
    }

    setupListeners() {
        // Update display when auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                this.loadWordLists();
            }
        });
    }

    async saveWordList(words, listName = 'Custom Word List') {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!user) {
            showNotification('Please log in to save word lists', 'error');
            return;
        }

        try {
            const { error } = await supabase
                .from(WORD_LISTS_TABLE)
                .insert([{
                    words: Array.isArray(words) ? words : [words],
                    user_id: user.id,
                    user_name: user.user_metadata?.name || 'Anonymous',
                    timestamp: new Date().toISOString(),
                    game_type: 'hangman',
                    list_name: listName
                }]);

            if (error) throw error;
            showNotification('Word list saved successfully!', 'success');
            this.loadWordLists();

        } catch (error) {
            console.error('Error saving word list:', error);
            showNotification('Failed to save word list', 'error');
        }
    }

    async loadWordLists() {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!user) return;

        try {
            const { data: wordLists, error } = await supabase
                .from(WORD_LISTS_TABLE)
                .select('*')
                .eq('user_id', user.id)
                .eq('game_type', 'hangman');

            if (error) throw error;
            this.updateWordListDisplay(wordLists);
        } catch (error) {
            console.error('Error loading word lists:', error);
            showNotification('Failed to load word lists', 'error');
        }
    }

    async deleteWordList(listId) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!user) {
            showNotification('Please log in to delete word lists', 'error');
            return;
        }

        try {
            const { error } = await supabase
                .from(WORD_LISTS_TABLE)
                .delete()
                .eq('id', listId)
                .eq('user_id', user.id); // Extra security check

            if (error) throw error;
            showNotification('Word list deleted successfully', 'success');
            this.loadWordLists();
        } catch (error) {
            console.error('Error deleting word list:', error);
            showNotification('Failed to delete word list', 'error');
        }
    }

    updateWordListDisplay(wordLists) {
        const container = document.getElementById('savedWordLists');
        if (!container) return;

        if (wordLists.length === 0) {
            container.innerHTML = '<p class="empty-state">No saved word lists yet</p>';
            return;
        }

        container.innerHTML = wordLists.map(list => `
            <div class="word-list-item" data-id="${list.id}">
                <div class="word-info">
                    <span class="word-text">${list.list_name}</span>
                    <span class="word-meta">
                        ${list.words.length} words • Created ${new Date(list.timestamp).toLocaleDateString()}
                    </span>
                </div>
                <div class="actions">
                    <button class="use-list-btn" onclick="wordListManager.useWordList('${list.id}')">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="delete-btn" onclick="wordListManager.deleteWordList('${list.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async useWordList(listId) {
        try {
            const { data: wordList, error } = await supabase
                .from(WORD_LISTS_TABLE)
                .select('*')
                .eq('id', listId)
                .single();
            
            if (error) throw error;
            
            if (wordList?.words?.length > 0) {
                window.customWordList = wordList.words;
                window.startCustomWordList();
                showNotification(`Loaded word list: ${wordList.list_name}`, 'success');
            }
        } catch (error) {
            console.error('Error loading word list:', error);
            showNotification('Failed to load word list', 'error');
        }
    }
}

// Initialize the word list manager
window.wordListManager = new WordListManager(); 