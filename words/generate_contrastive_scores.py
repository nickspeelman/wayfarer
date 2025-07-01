
from openai import OpenAI
import numpy as np
import json
import os
from tqdm import tqdm
from sklearn.metrics.pairwise import cosine_similarity
from wordfreq import word_frequency
from nltk.corpus import stopwords
import nltk

nltk.download('stopwords')

# CONFIGURATION ------------------------------
from dotenv import load_dotenv
load_dotenv()
OpenAI.api_key = os.getenv("OPENAI_API_KEY")
WORDLIST_PATH = "words_alpha.txt"
POSITIVE_SEEDS_PATH = "positive_seeds.json"
NEGATIVE_SEEDS_PATH = "negative_seeds.json"
CHECKPOINT_JSON = "checkpoint_contrastive_scores.json"
EMBEDDINGS_JSON = "checkpoint_embeddings.json"
MAX_WORDS_TO_TEST = 20000
WORD_LENGTH_RANGE = (3, 7)
MIN_FREQ = 1e-6
# --------------------------------------------

stop_words = set(stopwords.words("english"))
client = OpenAI()

def get_embedding(text, model="text-embedding-ada-002"):
    response = client.embeddings.create(input=[text], model=model)
    return response.data[0].embedding

def cosine_sim(vec1, vec2):
    return cosine_similarity([vec1], [vec2])[0][0]

def load_filtered_words(wordlist_path, length_range=(4, 6), max_words=3000, min_freq=1e-6):
    with open(wordlist_path, "r") as f:
        raw_words = [line.strip().lower() for line in f if line.strip().isalpha()]
    filtered = []
    for w in raw_words:
        if w in stop_words:
            continue
        if not (length_range[0] <= len(w) <= length_range[1]):
            continue
        freq = word_frequency(w, "en")
        if freq >= min_freq:
            filtered.append((w, freq))
    filtered.sort(key=lambda x: x[1], reverse=True)
    return filtered[:max_words]

def compute_centroids(seed_dict):
    centroids = {}
    for theme, words in seed_dict.items():
        embeddings = [get_embedding(w) for w in words]
        centroids[theme] = np.mean(embeddings, axis=0)
    return centroids

def load_checkpoint(path):
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return {}

def save_checkpoint(path, data):
    with open(path, "w") as f:
        json.dump(data, f)

def main():
    print("🔹 Loading seed lists...")
    with open(POSITIVE_SEEDS_PATH, "r") as f:
        positive_seeds = json.load(f)
    with open(NEGATIVE_SEEDS_PATH, "r") as f:
        negative_seeds = json.load(f)

    print("🔹 Computing centroids...")
    pos_centroids = compute_centroids(positive_seeds)
    neg_centroids = compute_centroids(negative_seeds)

    print("🔹 Loading and filtering candidate words...")
    filtered_words = load_filtered_words(WORDLIST_PATH, WORD_LENGTH_RANGE, MAX_WORDS_TO_TEST, MIN_FREQ)
    words = [w for w, _ in filtered_words]
    freqs = dict(filtered_words)

    print(f"🔹 Loaded {len(words)} words. Checking for existing checkpoint...")
    checkpoint = load_checkpoint(CHECKPOINT_JSON)
    embeddings_checkpoint = load_checkpoint(EMBEDDINGS_JSON)
    completed_words = set(checkpoint.keys())

    for word in tqdm(words):
        if word in completed_words:
            continue
        try:
            emb = get_embedding(word)
            score_map = {"frequency": freqs[word]}
            for p_theme, p_vec in pos_centroids.items():
                for n_theme, n_vec in neg_centroids.items():
                    pair_key = f"{p_theme}-{n_theme}"
                    sim_p = cosine_sim(emb, p_vec)
                    sim_n = cosine_sim(emb, n_vec)
                    contrast = sim_p - sim_n
                    score_map[pair_key] = contrast
            checkpoint[word] = score_map
            embeddings_checkpoint[word] = emb
            if len(checkpoint) % 25 == 0:
                save_checkpoint(CHECKPOINT_JSON, checkpoint)
                save_checkpoint(EMBEDDINGS_JSON, embeddings_checkpoint)
        except Exception as e:
            print(f"❌ {word}: {e}")

    print("🔹 Final save...")
    save_checkpoint(CHECKPOINT_JSON, checkpoint)
    save_checkpoint(EMBEDDINGS_JSON, embeddings_checkpoint)
    print(f"✅ Done. Checkpoints saved to {CHECKPOINT_JSON} and {EMBEDDINGS_JSON}")

if __name__ == "__main__":
    main()
