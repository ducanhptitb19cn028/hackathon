from sqlalchemy import Column, Integer, ForeignKey, Table
from app.core.database import Base

# Association tables
video_tags = Table(
    'video_tags',
    Base.metadata,
    Column('video_id', Integer, ForeignKey('videos.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)

video_skills = Table(
    'video_skills',
    Base.metadata,
    Column('video_id', Integer, ForeignKey('videos.id')),
    Column('skill_id', Integer, ForeignKey('skills.id'))
)

learning_path_video = Table(
    'learning_path_video',
    Base.metadata,
    Column('learning_path_id', Integer, ForeignKey('learning_paths.id')),
    Column('video_id', Integer, ForeignKey('videos.id')),
)

learning_path_skill = Table(
    'learning_path_skill',
    Base.metadata,
    Column('learning_path_id', Integer, ForeignKey('learning_paths.id')),
    Column('skill_id', Integer, ForeignKey('skills.id')),
) 